import fs from 'fs';
import admin from 'firebase-admin';
import { env } from './env';

function loadServiceAccountFromEnv(): {
  cert: admin.ServiceAccount;
  projectId: string;
} {
  const parsed = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON!) as admin.ServiceAccount &
    Record<string, unknown>;
  const raw = parsed as Record<string, unknown>;
  const pk = raw.private_key ?? raw.privateKey;
  const email = raw.client_email ?? raw.clientEmail;
  const projectId = String(raw.project_id ?? '');
  if (!pk || !email) {
    throw new Error(
      'Service account JSON must include private_key and client_email (download "Generate new private key", not web client config).'
    );
  }
  if (!projectId) {
    throw new Error('Service account JSON must include project_id');
  }
  return { cert: parsed, projectId };
}

function loadCredentialsFromFile(): { cert: admin.ServiceAccount; projectId: string } {
  const path = env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!path) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set');
  }
  const parsed = JSON.parse(fs.readFileSync(path, 'utf-8')) as admin.ServiceAccount &
    Record<string, unknown>;
  const raw = parsed as Record<string, unknown>;
  const projectId = String(raw.project_id ?? '');
  if (!projectId) {
    throw new Error('Credentials file must include project_id');
  }
  return { cert: parsed, projectId };
}

function initFirebase(): void {
  if (admin.apps.length > 0) return;

  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    let cert: admin.ServiceAccount;
    let projectId: string;
    try {
      ({ cert, projectId } = loadServiceAccountFromEnv());
    } catch (e) {
      console.error(
        '[Firebase] FIREBASE_SERVICE_ACCOUNT_JSON is not valid or is missing required fields.'
      );
      throw e;
    }
    admin.initializeApp({
      credential: admin.credential.cert(cert),
      projectId,
    });
    console.log('[Firebase] Initialized (Firestore only; trade images stored inline in documents)');
    return;
  }

  const { cert, projectId } = loadCredentialsFromFile();
  admin.initializeApp({
    credential: admin.credential.cert(cert),
    projectId,
  });
  console.log('[Firebase] Initialized (Firestore only; trade images stored inline in documents)');
}

initFirebase();

export const db = admin.firestore();
