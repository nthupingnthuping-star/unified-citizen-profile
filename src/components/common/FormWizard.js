import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

const FormWizard = ({ steps, onComplete, submitting }) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else onComplete();
  };

  const back = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="module-card" style={{ padding: 24 }}>
      
      {/* Progress Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 30, flexWrap: 'wrap' }}>
        {steps.map((step, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: currentStep === index ? 'bold' : 'normal',
              background: currentStep === index ? '#003366' : '#f1f5f9',
              color: currentStep === index ? 'white' : '#64748b',
              opacity: index > currentStep ? 0.6 : 1,
            }}
          >
            <span>{index + 1}.</span> {step.title}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div style={{ minHeight: 300, marginBottom: 30 }}>
        {steps[currentStep].content}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
        <button
          type="button"
          onClick={back}
          disabled={currentStep === 0 || submitting}
          style={{
            padding: '12px 24px', borderRadius: 6, border: '1px solid #cbd5e1',
            background: 'white', color: '#334155', fontWeight: 'bold',
            cursor: (currentStep === 0 || submitting) ? 'not-allowed' : 'pointer',
            opacity: (currentStep === 0 || submitting) ? 0.5 : 1,
          }}
        >
          ← {t('back') || 'Back'}
        </button>
        <button
          type="button"
          onClick={next}
          disabled={submitting}
          style={{
            padding: '12px 24px', borderRadius: 6, border: 'none',
            background: '#003366', color: 'white', fontWeight: 'bold', 
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting 
            ? (t('loading') || 'Submitting...') 
            : currentStep === steps.length - 1 
              ? (t('submit') || 'Submit Application') 
              : (t('next') || 'Next →')}
        </button>
      </div>
    </div>
  );
};

export default FormWizard;