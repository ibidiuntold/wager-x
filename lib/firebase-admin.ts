import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const getFirebaseAdminApp = (): App => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials are missing');
  }

  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };

  try {
    return initializeApp({
      credential: cert(serviceAccount)
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
};

let firebaseAdminApp: App;

try {
  firebaseAdminApp = getFirebaseAdminApp();
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  // Re-throw the error to prevent the app from starting with invalid configuration
  throw error;
}

export const firebase_app_admin = firebaseAdminApp;
export const db = getFirestore(firebaseAdminApp);
