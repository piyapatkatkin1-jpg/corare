import { getApps, initializeApp, cert, deleteApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';
import { config } from '../config';

let firestoreDb: Firestore | null = null;
let firebaseInitialized = false;

interface FirebaseOptions {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
}

export function initFirebase(customOptions?: FirebaseOptions): { db: Firestore | null; isReady: boolean } {
  try {
    // Check if custom options provided
    const projectId = customOptions?.projectId || config.firebase.projectId;
    const clientEmail = customOptions?.clientEmail || config.firebase.clientEmail;
    const privateKey = (customOptions?.privateKey || config.firebase.privateKey)?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      if (getApps().length > 0) {
        // App already initialized, return firestore
        firestoreDb = getFirestore();
        firebaseInitialized = true;
        return { db: firestoreDb, isReady: true };
      }

      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      firestoreDb = getFirestore();
      firebaseInitialized = true;
      console.log(`🔥 [Firebase] Initialized Firestore for Project: ${projectId}`);
      return { db: firestoreDb, isReady: true };
    }

    // Check serviceAccountKey.json path
    const localKeyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(localKeyPath)) {
      if (getApps().length > 0) {
        firestoreDb = getFirestore();
        firebaseInitialized = true;
        return { db: firestoreDb, isReady: true };
      }
      const serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
      initializeApp({
        credential: cert(serviceAccount),
      });
      firestoreDb = getFirestore();
      firebaseInitialized = true;
      console.log(`🔥 [Firebase] Initialized with local serviceAccountKey.json`);
      return { db: firestoreDb, isReady: true };
    }

    return { db: null, isReady: false };
  } catch (err: any) {
    console.warn(`⚠️ [Firebase] Could not initialize Firebase Admin: ${err.message}`);
    return { db: null, isReady: false };
  }
}

export const getFirestoreDb = (): Firestore | null => {
  if (!firestoreDb) {
    initFirebase();
  }
  return firestoreDb;
};

/**
 * Test Firebase Firestore connection with provided credentials
 */
export async function testFirestoreCredentials(options: FirebaseOptions): Promise<{ success: boolean; message: string }> {
  const { projectId, clientEmail, privateKey } = options;

  if (!projectId || !clientEmail || !privateKey) {
    return {
      success: false,
      message: 'กรุณากรอกข้อมูล Firebase Project ID, Client Email และ Private Key ให้ครบถ้วน',
    };
  }

  const testAppName = `test-${Date.now()}`;
  try {
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
    const testApp = initializeApp(
      {
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
      },
      testAppName
    );

    const testDb = getFirestore(testApp);
    // Ping Firestore by reading or checking a collection
    await testDb.collection('settings').doc('ping').set({
      lastTest: new Date().toISOString(),
      status: 'connected',
    }, { merge: true });

    await deleteApp(testApp);

    return {
      success: true,
      message: `เชื่อมต่อ Firebase Firestore สำเร็จ! (Project: ${projectId})`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `การเชื่อมต่อ Firebase ล้มเหลว: ${err.message}`,
    };
  }
}
