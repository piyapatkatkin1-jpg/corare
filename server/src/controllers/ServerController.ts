import { Response } from 'express';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getFirestoreDb } from '../services/firebaseService';
import { AuthRequest } from '../middlewares/auth';

const COL = 'servers';

export class ServerController {
  /** GET /api/admin/servers */
  public static async list(_req: AuthRequest, res: Response) {
    try {
      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: 'Firebase not initialized' });

      const snap = await db.collection(COL).orderBy('createdAt', 'desc').get();
      const servers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.json({ servers });
    } catch (err: any) {
      console.error('list servers error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /** POST /api/admin/servers */
  public static async create(req: AuthRequest, res: Response) {
    try {
      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: 'Firebase not initialized' });

      const { name, identifier, host, port, rconPassword, isActive } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: 'กรุณากรอกชื่อเซิร์ฟเวอร์ (อย่างน้อย 2 ตัวอักษร)' });
      }

      const trimmedName = name.trim();
      const trimmedId = (identifier || trimmedName).trim().toLowerCase();

      // กันซ้ำ
      const dup = await db.collection(COL).where('name', '==', trimmedName).limit(1).get();
      if (!dup.empty) {
        return res.status(409).json({ error: 'ชื่อเซิร์ฟเวอร์นี้มีอยู่แล้ว' });
      }

      const now = FieldValue.serverTimestamp();
      const docRef = await db.collection(COL).add({
        name: trimmedName,
        identifier: trimmedId,
        host: host?.trim() || null,
        port: port ? Number(port) : 25575,
        rconPassword: rconPassword?.trim() || null,
        isActive: isActive !== false,
        createdAt: now,
        updatedAt: now,
      });

      const created = await docRef.get();
      return res.status(201).json({
        success: true,
        server: { id: docRef.id, ...created.data() },
      });
    } catch (err: any) {
      console.error('create server error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /** PUT /api/admin/servers/:id */
  public static async update(req: AuthRequest, res: Response) {
    try {
      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: 'Firebase not initialized' });

      const { id } = req.params;
      const ref = db.collection(COL).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ error: 'ไม่พบเซิร์ฟเวอร์' });

      const { name, identifier, host, port, rconPassword, isActive } = req.body;
      const patch: any = { updatedAt: FieldValue.serverTimestamp() };
      if (name !== undefined) patch.name = name.trim();
      if (identifier !== undefined) patch.identifier = identifier.trim().toLowerCase();
      if (host !== undefined) patch.host = host?.trim() || null;
      if (port !== undefined) patch.port = Number(port);
      if (rconPassword !== undefined) patch.rconPassword = rconPassword?.trim() || null;
      if (isActive !== undefined) patch.isActive = !!isActive;

      await ref.update(patch);
      const updated = await ref.get();
      return res.json({ success: true, server: { id, ...updated.data() } });
    } catch (err: any) {
      console.error('update server error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /** DELETE /api/admin/servers/:id */
  public static async remove(req: AuthRequest, res: Response) {
    try {
      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: 'Firebase not initialized' });

      const { id } = req.params;

      // กันลบถ้ามีหมวดหมู่/สินค้าอ้างอิง
      const cats = await db.collection('categories').where('serverId', '==', id).limit(1).get();
      if (!cats.empty) {
        return res.status(400).json({ error: 'ลบไม่ได้ เพราะมีหมวดหมู่อ้างอิงอยู่' });
      }

      await db.collection(COL).doc(id).delete();
      return res.json({ success: true });
    } catch (err: any) {
      console.error('delete server error:', err);
      return res.status(500).json({ error: err.message });
    }
  }
}
