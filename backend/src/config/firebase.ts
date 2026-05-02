import admin from 'firebase-admin';
import { env } from './env';

function initFirebase(): void {
  if (admin.apps.length > 0) return;

  const bucket = env.FIREBASE_STORAGE_BUCKET;

  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    let parsed: admin.ServiceAccount;
    try {
      parsed = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as admin.ServiceAccount;
    } catch (e) {
      console.error(
        '[Firebase] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON. Use the service account key file from Firebase Console → Project settings → Service accounts (not the web app config).'
      );
      throw e;
    }
    const raw = parsed as unknown as Record<string, unknown>;
    const pk = raw.private_key ?? raw.privateKey;
    const email = raw.client_email ?? raw.clientEmail;
    if (!pk || !email) {
      throw new Error(
        'Service account JSON must include private_key and client_email (download "Generate new private key", not web client config).'
      );
    }
    admin.initializeApp({
      credential: admin.credential.cert(parsed),
      storageBucket: bucket,
    });
    return;
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: bucket,
  });
}

initFirebase();

export const db = admin.firestore();
export const bucket = admin.storage().bucket(env.FIREBASE_STORAGE_BUCKET);
