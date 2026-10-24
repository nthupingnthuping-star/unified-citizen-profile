export const SEARCH_INDEX = [
  // Home Affairs
  { name: 'Report Lost ID', path: '/home-affairs', dept: 'Home Affairs', icon: '❌', keywords: 'lost stolen block id card', simpleModeOnly: false },
  { name: 'Apply for ID Renewal', path: '/home-affairs', dept: 'Home Affairs', icon: '🪪', keywords: 'renew id card replacement', simpleModeOnly: false },
  { name: 'Birth Certificate', path: '/home-affairs', dept: 'Home Affairs', icon: '📄', keywords: 'birth registration child', simpleModeOnly: false },
  { name: 'Death Certificate', path: '/home-affairs', dept: 'Home Affairs', icon: '🕯️', keywords: 'death report deceased', simpleModeOnly: false },
  
  // Finance
  { name: 'Register for TIN', path: '/finance', dept: 'Finance', icon: '🧾', keywords: 'tax tin registration number', simpleModeOnly: false },
  { name: 'Tax Clearance', path: '/finance', dept: 'Finance', icon: '📋', keywords: 'tax clearance e-tcc rsl', simpleModeOnly: false },
  { name: 'PAYE Refund', path: '/finance', dept: 'Finance', icon: '💸', keywords: 'refund tax paye money back', simpleModeOnly: false },
  
  // Traffic
  { name: 'Learner License', path: '/traffic', dept: 'Traffic', icon: '🚗', keywords: 'learner driving permit test', simpleModeOnly: false },
  { name: 'Driver License', path: '/traffic', dept: 'Traffic', icon: '🪪', keywords: 'driver license driving test', simpleModeOnly: false },
  { name: 'Roadworthy Test', path: '/traffic', dept: 'Traffic', icon: '🔧', keywords: 'roadworthy car inspection', simpleModeOnly: false },
  { name: 'Vehicle Registration', path: '/traffic', dept: 'Traffic', icon: '📝', keywords: 'register car vehicle ownership', simpleModeOnly: false },
  
  // Pensions
  { name: 'Old Age Pension', path: '/pensions', dept: 'Pensions', icon: '💰', keywords: 'pension retire old age 65', simpleModeOnly: false },
  { name: 'Disability Grant', path: '/pensions', dept: 'Pensions', icon: '♿', keywords: 'disability grant medical', simpleModeOnly: false },
  { name: 'Pension Claim', path: '/pension/claims', dept: 'Pensions', icon: '📝', keywords: 'claim pension retirement fund', simpleModeOnly: false },
  
  // Police
  { name: 'Report a Crime', path: '/police', dept: 'Police', icon: '🚨', keywords: 'police crime theft report emergency', simpleModeOnly: false },
  { name: 'Police Clearance', path: '/police', dept: 'Police', icon: '📜', keywords: 'clearance travel visa police', simpleModeOnly: false },
  { name: 'Traffic Accident Report', path: '/police', dept: 'Police', icon: '🚙', keywords: 'accident crash car police report', simpleModeOnly: false },
  { name: 'Cybercrime', path: '/police', dept: 'Police', icon: '💻', keywords: 'online scam fraud hacking', simpleModeOnly: false },
  
  // Passport
  { name: 'New Passport', path: '/passport', dept: 'Passport', icon: '🛂', keywords: 'passport travel new', simpleModeOnly: false },
  { name: 'Renew Passport', path: '/passport', dept: 'Passport', icon: '🔄', keywords: 'passport renewal travel', simpleModeOnly: false },

  // Other
  { name: 'Book Appointment', path: '/appointments/book', dept: 'General', icon: '📅', keywords: 'book appointment visit office', simpleModeOnly: false },
  { name: 'Access History', path: '/access-history', dept: 'General', icon: '🔒', keywords: 'privacy history who viewed', simpleModeOnly: false },
  { name: 'Notifications', path: '/notifications', dept: 'General', icon: '🔔', keywords: 'alerts messages updates', simpleModeOnly: false },
];

// Helper to find matches
export const searchServices = (query) => {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  
  return SEARCH_INDEX.filter((service) => {
    const searchable = `${service.name} ${service.dept} ${service.keywords}`.toLowerCase();
    return searchable.includes(q);
  });
};