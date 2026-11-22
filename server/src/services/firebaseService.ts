
import {
  getApps,
  initializeApp,
  cert,
  deleteApp,
  App,
} from 'firebase-admin/app';

import {
  getFirestore,
  Firestore,
} from 'firebase-admin/firestore';

import * as path from 'path';
import * as fs from 'fs';

import { config } from '../config';

interface FirebaseOptions {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
}

interface FirebaseInitResult {
  db: Firestore | null;
  isReady: boolean;
}

let firestoreDb: Firestore | null = null;
let firebaseInitialized = false;

function formatPrivateKey(key?: string): string | undefined {
  if (!key) return undefined;

  return key.replace(/\\n/g, '\n').trim();
}

function getExistingApp(): App | undefined {
  return getApps().find((app) => app.name === '[DEFAULT]');
}

function initializeFirebaseApp(
  projectId: string,
  clientEmail: string,
  privateKey: string
): App {
  const existingApp = getExistingApp();

  if (existingApp) {
    return existingApp;
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
  });
}

export function initFirebase(
  customOptions?: FirebaseOptions
): FirebaseInitResult {
  try {
    const projectId =
      customOptions?.projectId ||
      config.firebase.projectId;

    const clientEmail =
      customOptions?.clientEmail ||
      config.firebase.clientEmail;

    const privateKey = formatPrivateKey(
      customOptions?.privateKey ||
      config.firebase.privateKey
    );

    // Environment Variables
    if (projectId && clientEmail && privateKey) {
      const app = initializeFirebaseApp(
        projectId,
        clientEmail,
        privateKey
      );

      firestoreDb = getFirestore(app);
      firebaseInitialized = true;

      console.log(
        `🔥 [Firebase] Initialized Firestore for Project: ${projectId}`
      );

      return {
        db: firestoreDb,
        isReady: true,
      };
    }

    // Local Service Account
    const localKeyPath = path.resolve(
      process.cwd(),
      'serviceAccountKey.json'
    );

    if (fs.existsSync(localKeyPath)) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(localKeyPath, 'utf8')
      );

      const existingApp = getExistingApp();

      const app = existingApp || initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });

      firestoreDb = getFirestore(app);
      firebaseInitialized = true;

      console.log(
        '🔥 [Firebase] Initialized with serviceAccountKey.json'
      );

      return {
        db: firestoreDb,
        isReady: true,
      };
    }

    console.warn(
      '⚠️ [Firebase] Missing credentials. Firebase is disabled.'
    );

    return {
      db: null,
      isReady: false,
    };

  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : String(err);

    console.error(
      `⚠️ [Firebase] Initialization failed: ${message}`
    );

    return {
      db: null,
      isReady: false,
    };
  }
}

export function getFirestoreDb(): Firestore | null {
  if (firestoreDb && firebaseInitialized) {
    return firestoreDb;
  }

  const result = initFirebase();

  return result.db;
}

/**
 * Test Firebase Firestore credentials
 */
export async function testFirestoreCredentials(
  options: FirebaseOptions
): Promise<{
  success: boolean;
  message: string;
}> {
  const { projectId, clientEmail } = options;
  const privateKey = formatPrivateKey(options.privateKey);

  if (!projectId || !clientEmail || !privateKey) {
    return {
      success: false,
      message:
        'กรุณากรอก Firebase Project ID, Client Email และ Private Key ให้ครบถ้วน',
    };
  }

  const testAppName = `firebase-test-${Date.now()}`;

  let testApp: App | null = null;

  try {
    testApp = initializeApp(
      {
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      },
      testAppName
    );

    const testDb = getFirestore(testApp);

    await testDb
      .collection('settings')
      .doc('ping')
      .set(
        {
          lastTest: new Date().toISOString(),
          status: 'connected',
        },
        {
          merge: true,
        }
      );

    await deleteApp(testApp);
    testApp = null;

    return {
      success: true,
      message:
        `เชื่อมต่อ Firebase Firestore สำเร็จ! (Project: ${projectId})`,
    };

  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : String(err);

    return {
      success: false,
      message: `การเชื่อมต่อ Firebase ล้มเหลว: ${message}`,
    };

  } finally {
    if (testApp) {
      try {
        await deleteApp(testApp);
      } catch (cleanupError) {
        console.error(
          '[Firebase] Test app cleanup failed:',
          cleanupError
        );
      }
    }
  }
}
