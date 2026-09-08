'use client';

import { useState } from 'react';
import { useIntake } from '../lib/store';
import { useLang, makeT, COMMON } from '../lib/i18n';
import { fingerprintAnswers } from '../lib/noteFingerprint';

const LOCAL = {
  'Please read this and tell us if anything is wrong': {
    es: 'Por favor lea esto y díganos si algo está incorrecto',
    zh: '请阅读以下内容，并告诉我们是否有不准确之处',
  },
  'This is the note your surgeon will read before your visit. It was written from your answers, so it may have misunderstood something. Correct anything that is not right — your corrections take priority over everything else.': {
    es: 'Esta es la nota que su cirujano leerá antes de su cita. Fue redactada a partir de sus respuestas, por lo que puede haber malinterpretado algo. Corrija todo lo que no esté bien: sus correcciones tienen prioridad sobre todo lo demás.',
    zh: '这是您的外科医生在就诊前会阅读的病历记录。它是根据您的回答生成的，因此可能有误解之处。请更正任何不准确的内容——您的更正优先于其他所有信息。',
  },
  "That's not right": { es: 'Esto no es correcto', zh: '这里不对' },
  'Cancel': { es: 'Cancelar', zh: '取消' },
  'Save correction': { es: 'Guardar corrección', zh: '保存更正' },
  'What should it say instead?': { es: '¿Qué debería decir en su lugar?', zh: '正确的说法应该是什么？' },
  'For example: it says I had surgery in 2019, but it was 2021.': {
    es: 'Por ejemplo: dice que me operaron en 2019, pero fue en 2021.',
    zh: '例如：上面写着我2019年做了手术，但实际是2021年。',
  },
  'Your corrections': { es: 'Sus correcciones', zh: '您的更正' },
  'Remove': { es: 'Quitar', zh: '移除' },
  'Rewrite the note': { es: 'Reescribir la nota', zh: '重写病历' },
  'Rewrite the note with my changes': {
    es: 'Reescribir la nota con mis cambios',
    zh: '根据我的修改重写病历',
  },
  'You have changed your answers since this note was written, so it is now out of date. Rewrite it so your surgeon reads the current version.': {
    es: 'Ha cambiado sus respuestas desde que se escribió esta nota, por lo que está desactualizada. Reescríbala para que su cirujano lea la versión actual.',
    zh: '自本病历生成后您修改了答案，因此它已过时。请重写，以便您的外科医生看到最新版本。',
  },
  'Rewrite the note with my corrections': {
    es: 'Reescribir la nota con mis correcciones',
    zh: '根据我的更正重写病历',
  },
  'Rewriting…': { es: 'Reescribiendo…', zh: '正在重写……' },
  'The note has been rewritten with your corrections.': {
    es: 'La nota ha sido reescrita con sus correcciones.',
    zh: '病历已根据您的更正重写。',
  },
  'Could not rewrite the note. Your corrections have been saved and your care team will see them.': {
    es: 'No se pudo reescribir la nota. Sus correcciones se han guardado y su equipo de atención las verá.',
    zh: '无法重写病历。您的更正已保存，您的医疗团队会看到它们。',
  },
  'Everything here looks right': { es: 'Todo aquí es correcto', zh: '这里的内容都正确' },
  'Thank you — you can still make changes below if you spot something later.': {
    es: 'Gracias: aún puede hacer cambios abajo si nota algo más tarde.',
    zh: '谢谢——如果稍后发现问题，您仍可以在下方进行修改。',
  },
  'Need to change an answer instead?': {
    es: '¿Necesita cambiar una respuesta?',
    zh: '需要修改某个答案吗？',
  },
  'Go back and edit your answers': {
    es: 'Volver y editar sus respuestas',
    zh: '返回修改您的答案',
  },
};

/**
 * Lets the patient read the generated note and say what it got wrong.
 *
 * The note is written by a model from structured answers, so it can quietly
 * misstate a date, merge two symptoms, or overstate something. The patient is
 * the only person who can catch that before the visit, and asking them to
 * re-do the whole form to fix one sentence would guarantee they don't bother.
 *
 * Corrections attach to the paragraph they are about, so the rewrite knows
 * WHERE it went wrong rather than just being told something is off. They are
 * kept after the rewrite too: the clinician should be able to see which parts
 * of the history the patient personally challenged.
 */
export default function NoteReview({ narrative, onRewritten, onGoToStep, stale = false }) {
  const { data, setNested } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);

  const corrections = data.noteCorrections || [];
  const [openFor, setOpenFor] = useState(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // Split on blank lines so each paragraph (and each SECTION: heading block)
  // becomes its own correctable unit.
  const blocks = String(narrative || '')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const saveCorrection = (excerpt) => {
    if (!draft.trim()) return;
    setNested('noteCorrections', [
      ...corrections,
      {
        id: `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        excerpt,
        comment: draft.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft('');
    setOpenFor(null);
    setStatus('');
  };

  const removeCorrection = (id) => {
    setNested('noteCorrections', corrections.filter((c) => c.id !== id));
  };

  const rewrite = async () => {
    setBusy(true);
    setStatus('');
    try {
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send the corrections explicitly rather than relying on `data` having
        // flushed to the store — the patient may have just typed one.
        body: JSON.stringify({ intakeData: { ...data, noteCorrections: corrections } }),
      });
      const result = await res.json();
      if (result.error || !result.summary) {
        setStatus('error');
      } else {
        // Hand back the fingerprint of the data actually sent, so the new note
        // is stamped with its real source rather than whatever arrives later.
        onRewritten(result.summary, fingerprintAnswers(data));
        setStatus('ok');
      }
    } catch {
      setStatus('error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="text-left">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-navy-600 mb-1">
          {t('Please read this and tell us if anything is wrong')}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          {t('This is the note your surgeon will read before your visit. It was written from your answers, so it may have misunderstood something. Correct anything that is not right — your corrections take priority over everything else.')}
        </p>
      </div>

      <div className="space-y-2">
        {blocks.map((block, i) => {
          const isOpen = openFor === i;
          const flagged = corrections.filter((c) => c.excerpt === block);
          return (
            <div
              key={i}
              className={`group rounded-xl border transition-colors ${
                flagged.length
                  ? 'border-amber-300 bg-amber-50/50'
                  : 'border-transparent hover:border-gray-200 hover:bg-gray-50/70'
              }`}
            >
              <div className="p-3">
                <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
                  {block}
                </p>

                {flagged.map((c) => (
                  <div key={c.id} className="mt-2 flex items-start gap-2 text-xs text-amber-800 bg-amber-100/70 rounded-lg px-2.5 py-1.5">
                    <span aria-hidden="true">✎</span>
                    <span className="flex-1">{c.comment}</span>
                    <button
                      onClick={() => removeCorrection(c.id)}
                      className="text-amber-600 hover:text-red-600 flex-shrink-0"
                    >
                      {t('Remove')}
                    </button>
                  </div>
                ))}

                {!isOpen && (
                  <button
                    onClick={() => { setOpenFor(i); setDraft(''); }}
                    className="mt-1.5 text-xs font-medium text-gray-400 hover:text-amber-600 transition-colors
                               opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                  >
                    {t("That's not right")}
                  </button>
                )}

                {isOpen && (
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {t('What should it say instead?')}
                    </label>
                    <textarea
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={2}
                      placeholder={t('For example: it says I had surgery in 2019, but it was 2021.')}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none"
                    />
                    <div className="flex gap-2 mt-1.5">
                      <button
                        onClick={() => saveCorrection(block)}
                        disabled={!draft.trim()}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-navy-600 text-white
                                   disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {t('Save correction')}
                      </button>
                      <button
                        onClick={() => { setOpenFor(null); setDraft(''); }}
                        className="px-3 py-1 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700"
                      >
                        {t('Cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        {/* An edit made after the note was written leaves a note that reads as
            current but is not. Say so plainly and put the fix next to it. */}
        {stale && (
          <div className="flex items-start gap-3 p-3 mb-3 rounded-xl bg-amber-50 border border-amber-300">
            <span className="text-lg leading-none mt-0.5" aria-hidden="true">⚠️</span>
            <p className="text-sm text-amber-800 leading-relaxed">
              {t('You have changed your answers since this note was written, so it is now out of date. Rewrite it so your surgeon reads the current version.')}
            </p>
          </div>
        )}

        {corrections.length > 0 && (
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            {t('Your corrections')} ({corrections.length})
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={rewrite}
            disabled={busy}
            className={`${
              corrections.length || stale
                ? 'btn-primary'
                : 'px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:border-navy-300 hover:text-navy-600 transition-colors'
            } disabled:opacity-60`}
          >
            {busy
              ? t('Rewriting…')
              : corrections.length
              ? t('Rewrite the note with my corrections')
              : stale
              ? t('Rewrite the note with my changes')
              : t('Rewrite the note')}
          </button>

          {!corrections.length && !stale && (
            <>
              <button
                onClick={() => setConfirmed(true)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  confirmed
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700'
                }`}
              >
                {confirmed ? '✓ ' : ''}{t('Everything here looks right')}
              </button>
              {confirmed && (
                <span className="text-xs text-gray-400">
                  {t('Thank you — you can still make changes below if you spot something later.')}
                </span>
              )}
            </>
          )}
        </div>

        {status === 'ok' && (
          <p className="mt-2 text-sm text-green-600">{t('The note has been rewritten with your corrections.')}</p>
        )}
        {status === 'error' && (
          <p className="mt-2 text-sm text-red-600">
            {t('Could not rewrite the note. Your corrections have been saved and your care team will see them.')}
          </p>
        )}

        {onGoToStep && (
          <p className="mt-4 text-xs text-gray-400">
            {t('Need to change an answer instead?')}{' '}
            <button onClick={() => onGoToStep(0)} className="text-teal-600 hover:underline font-medium">
              {t('Go back and edit your answers')}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
