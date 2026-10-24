import { useState } from 'react';
import FormField from './FormField';
import CloudinaryUpload from './CloudinaryUpload';

// ============================================================
// EMPLOYMENT SECTION
// Reusable block for declaring employment + salary + payslip.
//
// Usage:
//   <EmploymentSection
//     value={form.employment}
//     onChange={(employment) => setForm({ ...form, employment })}
//   />
//
// The `value` object shape:
//   {
//     employer_name: string,
//     employment_type: 'Government' | 'Private sector' | 'Self-employed' | 'Unemployed' | 'Retired',
//     employee_number: string,
//     monthly_salary: string (number as string),
//     payslip_url: string | null,
//   }
// ============================================================

const EMPLOYMENT_TYPES = [
  { value: '', label: '— Select —' },
  { value: 'Government', label: 'Government / Public sector' },
  { value: 'Private sector', label: 'Private sector' },
  { value: 'Self-employed', label: 'Self-employed' },
  { value: 'Unemployed', label: 'Unemployed' },
  { value: 'Retired', label: 'Retired' },
];

const EMPLOYED_TYPES = ['Government', 'Private sector'];

const EmploymentSection = ({
  value = {},
  onChange,
  title = 'Employment',
  required = true,
  showSalaryAndPayslip = true,
  note = 'This helps us ensure you are not receiving duplicate payments from Finance and Pensions.',
}) => {
  const [showHelp, setShowHelp] = useState(false);

  const employment = {
    employer_name: value.employer_name || '',
    employment_type: value.employment_type || '',
    employee_number: value.employee_number || '',
    monthly_salary: value.monthly_salary || '',
    payslip_url: value.payslip_url || null,
  };

  const update = (patch) => {
    onChange?.({ ...employment, ...patch });
  };

  const isEmployed = EMPLOYED_TYPES.includes(employment.employment_type);
  const showExtra = showSalaryAndPayslip && isEmployed;

  return (
    <div className="module-section">
      <div className="module-section-title">{title}</div>

      {note && (
        <p style={{ fontSize: 13, color: '#666', marginTop: 0, marginBottom: 12 }}>
          {note}
        </p>
      )}

      {/* Employment type — first so we can conditionally show the rest */}
      <FormField
        label="Employment type *"
        as="select"
        value={employment.employment_type}
        onChange={(v) => update({ employment_type: v })}
        options={EMPLOYMENT_TYPES}
        required={required}
      />

      {/* Show the rest only when the citizen is actually employed */}
      {employment.employment_type && (
        <>
          <FormField
            label={
              employment.employment_type === 'Government'
                ? 'Ministry / Department *'
                : employment.employment_type === 'Private sector'
                ? 'Company name *'
                : 'Where do you work? *'
            }
            value={employment.employer_name}
            onChange={(v) => update({ employer_name: v })}
            placeholder={
              employment.employment_type === 'Government'
                ? 'e.g. Ministry of Education'
                : employment.employment_type === 'Private sector'
                ? 'e.g. Standard Lesotho Bank'
                : 'e.g. Self-employed'
            }
            required={required}
          />

          <FormField
            label="Employee / Payroll number (if any)"
            value={employment.employee_number}
            onChange={(v) => update({ employee_number: v })}
            placeholder="e.g. MoF-2019-04521"
          />
        </>
      )}

      {/* Salary + payslip — only for public/private sector employees */}
      {showExtra && (
        <>
          <FormField
            label="Monthly salary (M) *"
            type="number"
            value={employment.monthly_salary}
            onChange={(v) => update({ monthly_salary: v })}
            placeholder="e.g. 8500"
            required={required}
          />

          <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 'bold', color: '#333' }}>
              Latest payslip *
            </span>
            <button
              type="button"
              onClick={() => setShowHelp((s) => !s)}
              style={{
                background: '#e8f1ff',
                color: '#003366',
                border: 'none',
                borderRadius: '50%',
                width: 20,
                height: 20,
                fontSize: 12,
                fontWeight: 'bold',
                cursor: 'pointer',
                lineHeight: 1,
              }}
              title="Why do we need this?"
            >
              ?
            </button>
          </div>
          {showHelp && (
            <div style={{
              background: '#f0f6ff',
              border: '1px solid #cce0ff',
              borderRadius: 6,
              padding: 10,
              fontSize: 12,
              color: '#003366',
              marginBottom: 10,
              lineHeight: 1.6,
            }}>
              Finance uses your payslip to calculate the correct tax
              percentage to deduct from your salary. Your employer's name and
              payroll number must match what appears on the payslip.
            </div>
          )}

          <CloudinaryUpload
            label="Upload latest payslip (PDF or image) *"
            onUpload={(url) => update({ payslip_url: url })}
          />
          {employment.payslip_url && (
            <div style={{ fontSize: 12, color: '#006600', fontWeight: 'bold', marginTop: 6 }}>
              ✓ Payslip uploaded
            </div>
          )}
        </>
      )}

      {/* Info for non-employed citizens */}
      {employment.employment_type === 'Unemployed' && (
        <div style={{
          background: '#fff8e0',
          border: '1px solid #ffe08a',
          borderRadius: 6,
          padding: 12,
          marginTop: 10,
          fontSize: 13,
          color: '#7a5a00',
          lineHeight: 1.6,
        }}>
          You have declared that you are <strong>unemployed</strong>. If you
          start working, please update your employment details before applying
          for any tax or pension service.
        </div>
      )}

      {employment.employment_type === 'Retired' && (
        <div style={{
          background: '#e6f4ea',
          border: '1px solid #a8d5b8',
          borderRadius: 6,
          padding: 12,
          marginTop: 10,
          fontSize: 13,
          color: '#006600',
          lineHeight: 1.6,
        }}>
          <strong>Retired.</strong> You may now be eligible for a Retirement
          Fund (if you were previously a Government employee) or an Old Age
          Pension (if you were private sector). Check the Pensions page.
        </div>
      )}
    </div>
  );
};

export default EmploymentSection;