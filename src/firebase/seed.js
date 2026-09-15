// Run this ONCE to seed sample data.
// Usage: node src/firebase/seed.js
// BUT because Firebase Auth is a client SDK, easier to seed via the browser.

export const SAMPLE_CITIZENS = [
  {
    email: 'thabo@email.com',
    password: 'password123',
    national_id: '1234567890123',
    full_name: 'Thabo Mokoena',
    date_of_birth: '1985-06-15',
    gender: 'Male',
    residential_address: 'Maseru West, Ha Hoohlo',
    phone_number: '+266 5888 1234',
    citizenship_status: 'Citizen',
    verified_by_home_affairs: true,
  },
  {
    email: 'mamphe@email.com',
    password: 'password123',
    national_id: '9876543210987',
    full_name: 'Mamphe Ramoholi',
    date_of_birth: '1958-03-22',
    gender: 'Female',
    residential_address: 'Maseru East, Lithabaneng',
    phone_number: '+266 5777 5678',
    citizenship_status: 'Citizen',
    verified_by_home_affairs: true,
  },
  {
    email: 'nthabiseng@email.com',
    password: 'password123',
    national_id: '5556667778889',
    full_name: 'Nthabiseng Letsie',
    date_of_birth: '1992-11-08',
    gender: 'Female',
    residential_address: 'Berea, Teyateyaneng',
    phone_number: '+266 5999 9012',
    citizenship_status: 'Citizen',
    verified_by_home_affairs: true,
  },
];

export const SAMPLE_STAFF = [
  {
    email: 'home_affairs_officer@ucps.gov.ls',
    password: 'password123',
    full_name: 'Mpho Molapo',
    department_id: 1,
    role: 'supervisor',
  },
  {
    email: 'traffic_officer@ucps.gov.ls',
    password: 'password123',
    full_name: 'Teboho Mofokeng',
    department_id: 2,
    role: 'staff',
  },
  {
    email: 'finance_officer@ucps.gov.ls',
    password: 'password123',
    full_name: 'Palesa Thakane',
    department_id: 3,
    role: 'staff',
  },
  {
    email: 'pension_officer@ucps.gov.ls',
    password: 'password123',
    full_name: 'Mpho Ramoholi',
    department_id: 4,
    role: 'staff',
  },
  {
    email: 'police_officer@ucps.gov.ls',
    password: 'password123',
    full_name: 'Sello Mabote',
    department_id: 5,
    role: 'staff',
  },
  {
    email: 'passport_officer@ucps.gov.ls',
    password: 'password123',
    full_name: 'Refiloe Letsie',
    department_id: 6,
    role: 'staff',
  },
];

console.log('📋 Sample data ready. Use the Seeder component to insert it.');