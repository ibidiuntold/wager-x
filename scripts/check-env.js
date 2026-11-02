// Script to verify environment variables
require('dotenv').config({ path: '.env.local' });

console.log('\nChecking environment variables...\n');

// Debug: Print detailed environment info
console.log('Process CWD:', process.cwd());
console.log('Env file path:', require('path').resolve('.env.local'));
console.log('\nEnvironment variable presence check:');
[
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
].forEach(varName => {
  const exists = process.env[varName] ? '✓' : '✗';
  const value = process.env[varName] ? 'present' : 'missing';
  console.log(`${exists} ${varName}: ${value}`);
});

console.log('\nAll loaded environment variables:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')));

const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);
const presentVars = requiredVars.filter(varName => !!process.env[varName]);

console.log('Environment:', process.env.NODE_ENV || 'not set');
console.log('\nPresent variables:', presentVars.length);
presentVars.forEach(varName => console.log(`✓ ${varName}`));

console.log('\nMissing variables:', missingVars.length);
missingVars.forEach(varName => console.log(`✗ ${varName}`));

if (missingVars.length > 0) {
  console.log('\nTroubleshooting steps:');
  console.log('1. Verify .env.local exists in project root');
  console.log('2. Check .env.local contains all variables from .env.example');
  console.log('3. Ensure no spaces around = in variable assignments');
  console.log('4. Make sure values are not wrapped in quotes');
  console.log('5. Restart the Next.js development server');
  console.log('\nExample .env.local format:');
  console.log('NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here');
  console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com');
  console.log('\nNote: Values should not have quotes or spaces around =\n');
  process.exit(1);
} else {
  console.log('\n✓ All required environment variables are present\n');
}
