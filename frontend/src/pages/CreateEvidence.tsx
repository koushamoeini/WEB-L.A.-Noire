import { useNavigate, useSearchParams } from 'react-router-dom';
import { EVIDENCE_TYPES, EVIDENCE_TYPE_LABELS } from '../types/evidence';
import Sidebar from '../components/Sidebar';
import './CreateEvidence.css';

export default function CreateEvidence() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const caseId = searchParams.get('case');

  const evidenceTypes = [
    {
      type: EVIDENCE_TYPES.WITNESS,
      label: EVIDENCE_TYPE_LABELS[EVIDENCE_TYPES.WITNESS],
      description: 'ثبت صحبت‌های شاهدان محلی و افراد مرتبط',
      icon: '👤',
    },
    {
      type: EVIDENCE_TYPES.BIOLOGICAL,
      label: EVIDENCE_TYPE_LABELS[EVIDENCE_TYPES.BIOLOGICAL],
      description: 'شواهد زیستی، پزشکی و نتایج آزمایش‌ها',
      icon: '🧬',
    },
    {
      type: EVIDENCE_TYPES.VEHICLE,
      label: EVIDENCE_TYPE_LABELS[EVIDENCE_TYPES.VEHICLE],
      description: 'اطلاعات وسایل نقلیه مرتبط با پرونده',
      icon: '🚗',
    },
    {
      type: EVIDENCE_TYPES.ID_DOCUMENT,
      label: EVIDENCE_TYPE_LABELS[EVIDENCE_TYPES.ID_DOCUMENT],
      description: 'مدارک شناسایی و اطلاعات شخصی',
      icon: '📄',
    },
    {
      type: EVIDENCE_TYPES.OTHER,
      label: EVIDENCE_TYPE_LABELS[EVIDENCE_TYPES.OTHER],
      description: 'سایر شواهد و موارد مرتبط',
      icon: '📦',
    },
  ];

  return (
    <div className="layout-with-sidebar">
      <Sidebar />
      <div className="main-content">
        <div className="create-evidence-container">
          <div className="create-evidence-header">
            <h1>انتخاب نوع شواهد</h1>
            <button
              className="cancel-btn"
              onClick={() => navigate(caseId ? `/evidence?case=${caseId}` : '/evidence')}
            >
              بازگشت
            </button>
          </div>

          <div className="evidence-types-grid">
            {evidenceTypes.map((item) => (
              <div
                key={item.type}
                className="evidence-type-card"
                onClick={() =>
                  navigate(
                    `/evidence/create/${item.type}${caseId ? `?case=${caseId}` : ''}`
                  )
                }
              >
                <div className="evidence-type-icon">{item.icon}</div>
                <h3>{item.label}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
