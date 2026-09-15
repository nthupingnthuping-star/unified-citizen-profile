// ============================================================
// ELIGIBILITY RULES
// ============================================================

export const ELIGIBILITY_RULES = {
  OLD_AGE_PENSION: {
    minAge: 65,
    label: 'Old Age Pension',
    service: 'Old Age Pension',
    department: 'PENSIONS',
  },
  LEARNER_LICENSE_STANDARD: {
    minAge: 18,
    label: 'Learner License (Standard Car)',
    service: 'Learner License',
    department: 'TRAFFIC',
  },
  LEARNER_LICENSE_MOTORCYCLE: {
    minAge: 16,
    label: 'Learner License (Motorcycle)',
    service: 'Learner License',
    department: 'TRAFFIC',
  },
};

// ============================================================
// CALCULATE AGE
// ============================================================
export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  // Not yet had birthday this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

// ============================================================
// CHECK ELIGIBILITY
// ============================================================
export function checkEligibility(ruleKey, dateOfBirth) {
  const rule = ELIGIBILITY_RULES[ruleKey];

  if (!rule) {
    return { eligible: true, message: '' };
  }

  const age = calculateAge(dateOfBirth);

  if (age === null) {
    return {
      eligible: false,
      age: null,
      rule,
      message: 'Your date of birth is missing from your profile. Please update your profile first.',
    };
  }

  if (age < rule.minAge) {
    return {
      eligible: false,
      age,
      rule,
      message: `You must be ${rule.minAge} years or older to apply for ${rule.label}. You are ${age}.`,
    };
  }

  return {
    eligible: true,
    age,
    rule,
    message: `✓ You are eligible (age ${age}).`,
  };
}