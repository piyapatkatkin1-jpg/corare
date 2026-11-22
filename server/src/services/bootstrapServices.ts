import { FieldValue } from 'firebase-admin/firestore';
import { getFirestoreDb } from './firebaseService';

/**
 * สร้างข้อมูลเริ่มต้น: server "smp" + category "smp"
 * ถ้ามีอยู่แล้วจะข้าม
 */
export async function bootstrapDefaultSmpData(): Promise<void> {
  const db = getFirestoreDb();
  if (!db) {
    console.warn('⚠️ [Bootstrap] Firebase not initialized — skip');
    return;
  }

  // ---------- 1. Server: smp ----------
  const serversCol = db.collection('servers');
  const existingServerSnap = await serversCol.where('identifier', '==', 'smp').limit(1).get();

  let serverId: string;
  if (existingServerSnap.empty) {
    const now = FieldValue.serverTimestamp();
    const docRef = await serversCol.add({
      name: 'smp',
      identifier: 'smp',
      host: process.env.SMP_RCON_HOST || null,
      port: Number(process.env.SMP_RCON_PORT) || 25575,
      rconPassword: process.env.SMP_RCON_PASSWORD || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    serverId = docRef.id;
    console.log(`✅ [Bootstrap] Created server "smp" (id=${serverId})`);
  } else {
    serverId = existingServerSnap.docs[0].id;
    console.log(`ℹ️ [Bootstrap] Server "smp" already exists (id=${serverId})`);
  }

  // ---------- 2. Category: smp (ผูกกับ server smp) ----------
  const catsCol = db.collection('categories');
  const existingCatSnap = await catsCol
    .where('serverId', '==', serverId)
    .where('slug', '==', 'smp')
    .limit(1)
    .get();

  if (existingCatSnap.empty) {
    const now = FieldValue.serverTimestamp();
    const docRef = await catsCol.add({
      name: 'smp',
      slug: 'smp',
      description: 'หมวดหมู่หลักของเซิร์ฟเวอร์ SMP',
      icon: null,
      serverId,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`✅ [Bootstrap] Created category "smp" (id=${docRef.id}) under server ${serverId}`);
  } else {
    console.log(`ℹ️ [Bootstrap] Category "smp" already exists`);
  }
}
