/**
 * Central field mapping: how a citizen's Firestore document
 * maps to form fields across every module.
 *
 * Keys   = form field names
 * Values = citizen document field names (or a function)
 *
 * `fillFormFromCitizen()` skips values that are empty / undefined
 * and only touches keys that already exist in the target form.
 */
export const CITIZEN_TO_FORM_MAP = {
  // ---------- Identity ----------
  full_name: 'full_name',
  national_id: 'national_id',
  date_of_birth: 'date_of_birth',
  gender: 'gender',
  citizenship_status: (c) => c.citizenship_status || 'Mosotho',
  marital_status: 'marital_status',
  photo_url: 'photo_url',

  // ---------- Contact ----------
  phone_number: 'phone_number',
  email: 'email',
  residential_address: 'residential_address',

  // ---------- Bank / payout ----------
  bank_name: (c) => c.bank_account?.bank_name || c.bank_name || '',
  account_number: (c) => c.bank_account?.account_number || c.account_number || '',
  branch_code: (c) => c.bank_account?.branch_code || c.branch_code || '',
  account_holder: (c) => c.bank_account?.account_holder || c.full_name || '',
  account_type: (c) => c.bank_account?.account_type || 'Cheque',

  // ---------- Employment ----------
  employer_name: (c) => c.employment?.employer_name || c.employer_name || '',
  employment_type: (c) => c.employment?.employment_type || c.employment_type || '',
  employee_number: (c) => c.employment?.employee_number || c.employee_number || '',

  // ---------- Business (from TIN registration or citizen record) ----------
  business_name: (c) => c.business_name || c.business?.name || '',
  business_type: (c) => c.business_type || c.business?.type || '',
  traders_license_number: (c) =>
    c.traders_license_number || c.business?.traders_license_number || '',

  // ---------- Documents / identifiers ----------
  tin: 'tin',
  passport_number: 'passport_number',

  // ---------- Pension ----------
  member_number: (c) => c.pension_member_number || '',
  employment_branch: (c) =>
    c.employment?.branch || c.employment_branch || 'Public Service',

  // ---------- Chief / traditional ----------
  chief_name: 'chief_name',
  chief_confirmation_number: 'chief_confirmation_number',
};

/**
 * Fill a form object from a citizen document.
 *
 * @param {object} currentForm   - existing form state
 * @param {object} citizen       - Firestore citizen document
 * @param {object} opts
 * @param {boolean} opts.overwrite - if true, replace existing values; else only fill blanks
 * @returns {object} new form object
 */
export function fillFormFromCitizen(currentForm, citizen, opts = {}) {
  if (!citizen) return currentForm;
  const { overwrite = false } = opts;
  const next = { ...currentForm };

  Object.entries(CITIZEN_TO_FORM_MAP).forEach(([formKey, citizenKey]) => {
    // Only touch keys that exist in the target form
    if (!(formKey in next)) return;

    const value =
      typeof citizenKey === 'function' ? citizenKey(citizen) : citizen[citizenKey];

    if (value === undefined || value === null || value === '') return;

    // Don't overwrite existing values unless explicitly asked
    if (!overwrite && next[formKey] !== undefined && next[formKey] !== '') return;

    next[formKey] = value;
  });

  return next;
}