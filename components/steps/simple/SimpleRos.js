'use client';

import { useEffect } from 'react';
import { useIntake, useService } from '../../../lib/store';
import { useLang, makeT, COMMON } from '../../../lib/i18n';
import StepNavigation from '../../ui/StepNavigation';
import { Card, BigChoice } from './Big';

const LOCAL = {
  'Anything else going on?': { es: '¿Algo más que le pase?', zh: '还有其他情况吗？' },
  'Tap anything you have now. If none of these apply, tap the last button.': { es: 'Toque lo que tenga ahora. Si nada de esto le aplica, toque el último botón.', zh: '点选您现在有的情况。如果都没有，请点最后一个按钮。' },
  'None of these': { es: 'Ninguno de estos', zh: '都没有' },
};

/**
 * The short form's review of systems: the spine screen list (the same
 * questions the full form's "short list" asks) as big buttons, plus "None of
 * these". A tap stores 'yes' exactly where the full review would, so the note
 * and Practice Hub read it as an ordinary screening review (mode 'screen').
 * Items already answered on the questions screen (numbness, weakness,
 * walking, bladder or bowel) are carried over and not asked again.
 */
export default function SimpleRos({ onNext, onBack }) {
  const { data, setNested } = useIntake();
  const svc = useService();
  const { ROS_SCREEN, rosSectionOf, TRANSLATIONS, prefilledROS } = svc.rosSystems;
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL, ...TRANSLATIONS }, lang);
  const ros = data.reviewOfSystems || {};

  // The questions screen stores its yes/no answers as 'yes' / 'no'; the
  // prefill reads the full form's booleans, so convert before asking it.
  const overall = Object.fromEntries(Object.entries(data.hpiData?.overall || {}).map(([k, v]) => [k, v === 'yes' ? true : v === 'no' ? false : v]));
  const prefilled = prefilledROS ? prefilledROS({ ...data, hpiData: { ...data.hpiData, overall } }) : {};
  useEffect(() => {
    setNested('reviewOfSystems.mode', 'screen');
    for (const [id, v] of Object.entries(prefilled)) {
      const section = rosSectionOf(id);
      if (!section) continue;
      const cur = ros?.[section]?.[id];
      if (!cur || (v === 'yes' && cur !== 'yes')) setNested(`reviewOfSystems.${section}.${id}`, v);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const asked = ROS_SCREEN.filter((q) => !(q.id in prefilled));
  const valueOf = (q) => ros?.[rosSectionOf(q.id)]?.[q.id];
  const picked = asked.filter((q) => valueOf(q) === 'yes').map((q) => q.id);
  const answered = asked.some((q) => !!valueOf(q));
  const none = answered && picked.length === 0;

  const setPicked = (ids) => {
    for (const q of asked) setNested(`reviewOfSystems.${rosSectionOf(q.id)}.${q.id}`, ids.includes(q.id) ? 'yes' : 'no');
  };

  const options = [...asked.map((q) => ({ id: q.id, label: q.label })), { id: '__none', label: 'None of these' }];
  const value = none ? ['__none'] : picked;
  const onChange = (next) => {
    const wasNone = value.includes('__none');
    const nowNone = next.includes('__none');
    if (nowNone && !wasNone) { setPicked([]); return; }
    setPicked(next.filter((id) => id !== '__none'));
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="section-title">{t('Anything else going on?')}</h2>
        <p className="section-subtitle">{t('Tap anything you have now. If none of these apply, tap the last button.')}</p>
      </div>
      <Card>
        <BigChoice t={t} multi options={options} value={value} onChange={onChange} />
      </Card>
      <StepNavigation onNext={onNext} onBack={onBack} canGoNext={answered} />
    </div>
  );
}
