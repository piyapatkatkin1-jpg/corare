import { Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirestoreDb } from '../services/firebaseService';
import { AuthRequest } from '../middlewares/auth';

const COL = 'categories';

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ก-๙\s-]/g, '')
    .replace(/\s+/g, '-');
}

export class CategoryController {
  /** GET /api/admin/categories?serverId=xxx */
  public static async list(req: AuthRequest, res: Response) {
    try {
      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: 'Firebase not initialized' });

      const { serverId } = req.query as { serverId?: string };
      let q: FirebaseFirestore.Query = db.collection(COL);
      if (serverId) q = q.where('serverId', '==', serverId);
      q = q.orderBy('createdAt', 'desc');

      const snap = await q.get();
      const categories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.json({ categories });
    } catch (err: any) {
      console.error('list categories error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /** POST /api/admin/categories */
  public static async create(req: AuthRequest, res: Response) {
    try {
      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: 'Firebase not initialized' });

      const { name, slug, description, icon, serverId } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'กรุณากรอกชื่อหมวดหมู่' });
      }
      if (!serverId) {
        return res.status(400).json({ error: 'กรุณาเลือกเซิร์ฟเวอร์ก่อน (serverId)' });
      }

      // ตรวจว่า server มีจริง
      const serverDoc = await db.collection('servers').doc(serverId).get();
      if (!serverDoc.exists) {
        return res.status(404).json({ error: 'ไม่พบเซิร์ฟเวอร์ที่อ้างอิง' });
      }

      const finalSlug = toSlug(slug || name);

      // กันซ้ำ (serverId + slug)
      const dup = await db
        .collection(COL)
        .where('serverId', '==', serverId)
        .where('slug', '==', finalSlug)
        .limit(1)
        .get();
      if (!dup.empty) {
        return res.status(409).json({ error: 'slug นี้มีอยู่ในเซิร์ฟเวอร์นี้แล้ว' });
      }

      const now = FieldValue.serverTimestamp();
      const docRef = await db.collection(COL).add({
        name: name.trim(),
        slug: finalSlug,
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        serverId,
        createdAt: now,
        updatedAt: now,
      });

      const created = await docRef.get();
      return res.status(201).json({
        success: true,
        category: { id: docRef.id, ...created.data() },
      });
    } catch (err: any) {
      console.error('create category error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  /** PUT /api/admin/categories/:id */
  public static async update(req: AuthRequest, res: Response) {
    try {
      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: 'Firebase not initialized' });

      const { id } = req.params;
      const ref = db.collection(COL).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ error: 'ไม่พบหมวดหมู่' });

      const { name, slug, description, icon, serverId } = req.body;
      const patch: any = { updatedAt: FieldValue.serverTimestamp() };
      if (name !== undefined) patch.name = name.trim();
      if (slug !== undefined) patch.slug = toSlug(slug);
      if (description !== undefined) patch.description = description?.trim() || null;
      if (icon !== undefined) patch.icon = icon?.trim() || null;
      if (serverId !== undefined) patch.serverId = serverId;

      await ref.update(patch);
      const updated = await ref.get();
      return res.json({ success: true, category: { id, ...updated.data() } });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /** DELETE /api/admin/categories/:id */
  public static async remove(req: AuthRequest, res: Response) {
    try {
      const db = getFirestoreDb();
      if (!db) return res.status(503).json({ error: 'Firebase not initialized' });

      const { id } = req.params;
      // กันลบถ้ามีสินค้าอ้างอิง
      const prod = await db.collection('products').where('categoryId', '==', id).limit(1).get();
      if (!prod.empty) {
        return res.status(400).json({ error: 'ลบไม่ได้ เพราะมีสินค้าอ้างอิงอยู่' });
      }

      await db.collection(COL).doc(id).delete();
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
