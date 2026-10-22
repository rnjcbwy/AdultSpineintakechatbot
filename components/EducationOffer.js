'use client';

import { useEffect, useState } from 'react';
import { useIntake } from '../lib/store';
import { useLang, makeT, COMMON } from '../lib/i18n';

const LOCAL = {
  'Reading you may find helpful': { es: 'Lecturas que pueden serle útiles', zh: '可能对您有帮助的阅读资料' },
  'Based on what you shared, these guides from our practice may help you before your visit.': {
    es: 'Según lo que nos contó, estas guías de nuestra práctica pueden ayudarle antes de su visita.',
    zh: '根据您提供的信息，我们诊所的这些指南可能对您就诊前有所帮助。',
  },
  'Read the guide': { es: 'Leer la guía', zh: '阅读指南' },
  'Scan with your phone camera to read it later.': { es: 'Escanee con la cámara de su teléfono para leerla después.', zh: '用手机相机扫描，稍后阅读。' },
  'We will also email these to you at {email}.': { es: 'También se las enviaremos por correo electrónico a {email}.', zh: '我们也会将这些资料发送到您的邮箱 {email}。' },
  'These guides are general education and do not replace the advice we give you in person.': {
    es: 'Estas guías son educación general y no reemplazan los consejos que le damos en persona.',
    zh: '这些指南属于一般性健康教育，不能代替我们当面给您的建议。',
  },
  'Finding reading that fits your visit…': { es: 'Buscando lecturas que se ajusten a su visita…', zh: '正在查找适合您就诊的阅读资料……' },
};

/**
 * After submitting: up to three of the practice's patient-education guides
 * chosen for what the patient told us, in their language, each with a link
 * and (on the clinic tablet, and on wider screens) a QR code to scan. Shows
 * nothing when the language has no guides or nothing clearly fits.
 */
export default function EducationOffer({ submission }) {
  const { kiosk } = useIntake();
  const lang = useLang();
  const t = makeT({ ...COMMON, ...LOCAL }, lang);
  const [state, setState] = useState({ loading: true, guides: [], email: '' });

  useEffect(() => {
    if (!submission?.id || !submission?.token) { setState({ loading: false, guides: [], email: '' }); return undefined; }
    let live = true;
    fetch(`/api/intake/${submission.id}/education`, { headers: { Authorization: `Bearer ${submission.token}` }, cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { guides: [] }))
      .then((r) => { if (live) setState({ loading: false, guides: Array.isArray(r.guides) ? r.guides : [], email: r.email || '' }); })
      .catch(() => { if (live) setState({ loading: false, guides: [], email: '' }); });
    return () => { live = false; };
  }, [submission?.id, submission?.token]);

  if (state.loading) {
    return <p className="text-sm text-gray-400 mt-8" role="status">{t('Finding reading that fits your visit…')}</p>;
  }
  if (!state.guides.length) return null;

  return (
    <section className="mt-10 text-left animate-fade-in" aria-labelledby="education-title">
      <h3 id="education-title" className="text-xl font-semibold text-navy-600 text-center">{t('Reading you may find helpful')}</h3>
      <p className="text-sm text-gray-500 text-center mt-1 mb-5 max-w-md mx-auto">{t('Based on what you shared, these guides from our practice may help you before your visit.')}</p>
      <ul className="space-y-3">
        {state.guides.map((g) => (
          <li key={g.id} className="card flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-navy-600">{g.title}</p>
              {g.description && <p className="text-sm text-gray-500 mt-1 leading-relaxed">{g.description}</p>}
              <a href={g.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-sm font-semibold text-teal-600 underline">
                {t('Read the guide')}
              </a>
            </div>
            {g.qr && (
              <div className={`${kiosk ? 'flex' : 'hidden md:flex'} flex-col items-center shrink-0`}>
                {/* The QR code is generated on the server from the guide's own address. */}
                <div className={kiosk ? 'w-32 h-32' : 'w-24 h-24'} aria-hidden="true" dangerouslySetInnerHTML={{ __html: g.qr }} />
                {kiosk && <p className="text-xs text-gray-400 mt-1 w-32 text-center">{t('Scan with your phone camera to read it later.')}</p>}
              </div>
            )}
          </li>
        ))}
      </ul>
      {state.email && (
        <p className="text-sm text-gray-600 text-center mt-4">{t('We will also email these to you at {email}.').replace('{email}', state.email)}</p>
      )}
      <p className="text-xs text-gray-400 text-center mt-3">{t('These guides are general education and do not replace the advice we give you in person.')}</p>
    </section>
  );
}
