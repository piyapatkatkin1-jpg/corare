/**
 * Prisma-compatible data layer backed ONLY by Firebase Firestore.
 * Controllers keep calling prisma.<model>.<method>(...) but every read/write
 * goes to Firestore collections. No SQL/SQLite database is used.
 */
import { randomUUID } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getFirestoreDb } from './services/firebaseService';

type Rel = { model: string; type: 'one' | 'many'; fk: string; local?: string };
interface ModelDef {
  collection: string;
  defaults: () => Record<string, any>;
  relations: Record<string, Rel>;
}

const now = () => new Date();

const MODELS: Record<string, ModelDef> = {
  user: {
    collection: 'users',
    defaults: () => ({ role: 'USER', password: null, uuid: null, balance: 0, totalSpent: 0, isLinked: false, linkedAt: null, createdAt: now(), updatedAt: now() }),
    relations: {
      orders: { model: 'order', type: 'many', fk: 'userId' },
      topups: { model: 'topupTransaction', type: 'many', fk: 'userId' },
      redemptions: { model: 'codeRedemption', type: 'many', fk: 'userId' },
    },
  },
  linkSession: {
    collection: 'linkSessions',
    defaults: () => ({ uuid: null, status: 'PENDING', attempts: 0, ipAddress: null, createdAt: now() }),
    relations: {},
  },
  linkLog: {
    collection: 'linkLogs',
    defaults: () => ({ uuid: null, ipAddress: null, serverIdentifier: null, createdAt: now() }),
    relations: {},
  },
  gameServer: {
    collection: 'gameServers',
    defaults: () => ({ description: null, icon: null, banner: null, rconHost: null, rconPort: null, rconPassword: null, isActive: true, createdAt: now() }),
    relations: {
      categories: { model: 'category', type: 'many', fk: 'serverId' },
      products: { model: 'product', type: 'many', fk: 'serverId' },
      commandQueue: { model: 'commandQueue', type: 'many', fk: 'serverId' },
    },
  },
  category: {
    collection: 'categories',
    defaults: () => ({ icon: null, order: 0, createdAt: now() }),
    relations: {
      server: { model: 'gameServer', type: 'one', fk: 'serverId' },
      products: { model: 'product', type: 'many', fk: 'categoryId' },
    },
  },
  product: {
    collection: 'products',
    defaults: () => ({ originalPrice: null, isFeatured: false, isActive: true, stock: -1, createdAt: now() }),
    relations: {
      server: { model: 'gameServer', type: 'one', fk: 'serverId' },
      category: { model: 'category', type: 'one', fk: 'categoryId' },
      orderItems: { model: 'orderItem', type: 'many', fk: 'productId' },
    },
  },
  order: {
    collection: 'orders',
    defaults: () => ({ status: 'SUCCESS', createdAt: now() }),
    relations: {
      user: { model: 'user', type: 'one', fk: 'userId' },
      items: { model: 'orderItem', type: 'many', fk: 'orderId' },
    },
  },
  orderItem: {
    collection: 'orderItems',
    defaults: () => ({ status: 'SUCCESS' }),
    relations: {
      order: { model: 'order', type: 'one', fk: 'orderId' },
      product: { model: 'product', type: 'one', fk: 'productId' },
    },
  },
  commandQueue: {
    collection: 'commandQueue',
    defaults: () => ({ orderId: null, playerUuid: null, status: 'PENDING', executedAt: null, retryCount: 0, createdAt: now() }),
    relations: { server: { model: 'gameServer', type: 'one', fk: 'serverId' } },
  },
  topupTransaction: {
    collection: 'topupTransactions',
    defaults: () => ({ bonusPoints: 0, status: 'PENDING', voucherCode: null, reference: null, createdAt: now() }),
    relations: { user: { model: 'user', type: 'one', fk: 'userId' } },
  },
  redeemCode: {
    collection: 'redeemCodes',
    defaults: () => ({ pointReward: 0, commandReward: null, maxUses: 1, usedCount: 0, expiresAt: null, isActive: true, createdAt: now() }),
    relations: { redemptions: { model: 'codeRedemption', type: 'many', fk: 'codeId' } },
  },
  codeRedemption: {
    collection: 'codeRedemptions',
    defaults: () => ({ createdAt: now() }),
    relations: {
      code: { model: 'redeemCode', type: 'one', fk: 'codeId' },
      user: { model: 'user', type: 'one', fk: 'userId' },
    },
  },
  promotion: {
    collection: 'promotions',
    defaults: () => ({ subtitle: null, badge: null, isActive: true, order: 0, createdAt: now() }),
    relations: {},
  },
  news: {
    collection: 'news',
    defaults: () => ({ coverImage: null, publishedAt: now() }),
    relations: {},
  },
  rule: {
    collection: 'rules',
    defaults: () => ({ order: 0, createdAt: now() }),
    relations: {},
  },
  recentPurchase: {
    collection: 'recentPurchases',
    defaults: () => ({ uuid: null, createdAt: now() }),
    relations: {},
  },
  // Same collection/doc ("settings/default") the settings controller already uses.
  systemSetting: {
    collection: 'settings',
    defaults: () => ({
      storeName: 'corarevanilla', logoUrl: '', logoIcon: '💎', tagline: 'Official Web Store',
      serverIp: 'corarevanilla.xyz', discordUrl: 'https://discord.gg/corarevanilla',
      truemoneyPhone: '0812345678', promptpayEnabled: true, promptpayNumber: '0812345678',
      promptpayName: 'corarevanilla Store',
      serverSecretKey: 'corare_minecraft_secret_token_change_in_production',
      linkExpiryMinutes: 5, maxLinkAttempts: 5, rconEnabled: false, rconHost: 'corarevanilla.xyz',
      rconPort: 25575, rconPassword: '',
      announcement: 'ยินดีต้อนรับสู่ corarevanilla SMP - เซิร์ฟเวอร์มายคราฟเอาชีวิตรอด!',
      themeColor: 'light-blue', useFirebase: false, firebaseProjectId: '', firebaseClientEmail: '',
      firebasePrivateKey: '', updatedAt: now(),
    }),
    relations: {},
  },
};

// Children removed when a parent is deleted (onDelete: Cascade in the old schema)
const CASCADE: Record<string, Array<[string, string]>> = {
  user: [['order', 'userId'], ['topupTransaction', 'userId'], ['codeRedemption', 'userId']],
  gameServer: [['category', 'serverId'], ['product', 'serverId'], ['commandQueue', 'serverId']],
  category: [['product', 'categoryId']],
  product: [['orderItem', 'productId']],
  order: [['orderItem', 'orderId']],
  redeemCode: [['codeRedemption', 'codeId']],
};

function db() {
  const d = getFirestoreDb();
  if (!d) throw new Error('Firebase Firestore is not configured (set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)');
  return d;
}

function fromStore(id: string, data: Record<string, any>) {
  const out: Record<string, any> = { id };
  for (const [k, v] of Object.entries(data)) {
    out[k] = v && typeof v === 'object' && typeof v.toDate === 'function' ? v.toDate() : v;
  }
  return out;
}

function clean(obj: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out;
}

const isOp = (v: any) => v && typeof v === 'object' && !(v instanceof Date) && !Array.isArray(v);
const cmpVal = (v: any) => (v instanceof Date ? v.getTime() : v);

function matchOps(value: any, cond: any): boolean {
  if (!isOp(cond)) return cmpVal(value) === cmpVal(cond);
  const v = cmpVal(value);
  const insensitive = cond.mode === 'insensitive';
  const str = (x: any) => (insensitive ? String(x).toLowerCase() : String(x));
  for (const [op, raw] of Object.entries(cond)) {
    const c = cmpVal(raw);
    switch (op) {
      case 'mode': break;
      case 'equals': if (v !== c) return false; break;
      case 'not': if (isOp(raw) ? matchOps(value, raw) : v === c) return false; break;
      case 'in': if (!(raw as any[]).map(cmpVal).includes(v)) return false; break;
      case 'notIn': if ((raw as any[]).map(cmpVal).includes(v)) return false; break;
      case 'gt': if (!(v != null && v > c)) return false; break;
      case 'gte': if (!(v != null && v >= c)) return false; break;
      case 'lt': if (!(v != null && v < c)) return false; break;
      case 'lte': if (!(v != null && v <= c)) return false; break;
      case 'contains': if (v == null || !str(v).includes(str(c))) return false; break;
      case 'startsWith': if (v == null || !str(v).startsWith(str(c))) return false; break;
      case 'endsWith': if (v == null || !str(v).endsWith(str(c))) return false; break;
    }
  }
  return true;
}

async function matches(model: string, row: any, where: any): Promise<boolean> {
  if (!where) return true;
  const def = MODELS[model];
  for (const [key, cond] of Object.entries(where)) {
    if (cond === undefined) continue;
    if (key === 'AND') {
      for (const w of ([] as any[]).concat(cond as any)) if (!(await matches(model, row, w))) return false;
    } else if (key === 'OR') {
      let ok = false;
      for (const w of cond as any[]) if (await matches(model, row, w)) { ok = true; break; }
      if (!ok) return false;
    } else if (key === 'NOT') {
      for (const w of ([] as any[]).concat(cond as any)) if (await matches(model, row, w)) return false;
    } else if (def.relations[key]) {
      const rel = def.relations[key];
      if (rel.type === 'one') {
        const related = row[rel.fk] ? await getById(rel.model, row[rel.fk]) : null;
        if (!related || !(await matches(rel.model, related, cond))) return false;
      } else {
        const children = await query(rel.model, { [rel.fk]: row.id });
        const c: any = cond;
        let pass = true;
        if (c.some) { pass = false; for (const ch of children) if (await matches(rel.model, ch, c.some)) { pass = true; break; } }
        if (pass && c.none) { for (const ch of children) if (await matches(rel.model, ch, c.none)) { pass = false; break; } }
        if (!pass) return false;
      }
    } else if (!matchOps(row[key], cond)) {
      return false;
    }
  }
  return true;
}

async function getById(model: string, id: string) {
  const snap = await db().collection(MODELS[model].collection).doc(String(id)).get();
  return snap.exists ? fromStore(snap.id, snap.data() as any) : null;
}

/** Load rows for a model, pushing simple equality filters down to Firestore. */
async function query(model: string, where?: any): Promise<any[]> {
  const col = db().collection(MODELS[model].collection);
  if (where && typeof where.id === 'string') {
    const one = await getById(model, where.id);
    return one && (await matches(model, one, where)) ? [one] : [];
  }
  let q: FirebaseFirestore.Query = col;
  if (where) {
    for (const [k, v] of Object.entries(where)) {
      if (['AND', 'OR', 'NOT'].includes(k) || MODELS[model].relations[k]) continue;
      if (v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        q = q.where(k, '==', v);
      }
    }
  }
  const snap = await q.get();
  const rows = snap.docs.map((d) => fromStore(d.id, d.data()));
  const out: any[] = [];
  for (const r of rows) if (await matches(model, r, where)) out.push(r);
  return out;
}

function sortRows(rows: any[], orderBy: any) {
  if (!orderBy) return rows;
  const specs = ([] as any[]).concat(orderBy).flatMap((o) => Object.entries(o));
  return rows.sort((a, b) => {
    for (const [f, dir] of specs) {
      const x = cmpVal(a[f]); const y = cmpVal(b[f]);
      if (x === y) continue;
      if (x == null) return 1;
      if (y == null) return -1;
      return (x < y ? -1 : 1) * (dir === 'desc' ? -1 : 1);
    }
    return 0;
  });
}

async function shape(model: string, row: any, args: any): Promise<any> {
  if (!row) return row;
  const def = MODELS[model];
  let result: any = { ...row };
  const relSpec: Record<string, any> = {};
  let fieldSelect: Record<string, any> | null = null;

  if (args?.select) {
    fieldSelect = {};
    for (const [k, v] of Object.entries(args.select)) {
      if (k === '_count') continue;
      if (def.relations[k]) relSpec[k] = v === true ? {} : v;
      else if (v) fieldSelect[k] = true;
    }
  }
  if (args?.include) {
    for (const [k, v] of Object.entries(args.include)) if (v && k !== '_count') relSpec[k] = v === true ? {} : v;
  }

  for (const [name, spec] of Object.entries(relSpec)) {
    const rel = def.relations[name];
    if (rel.type === 'one') {
      const related = row[rel.fk] ? await getById(rel.model, row[rel.fk]) : null;
      result[name] = related ? await shape(rel.model, related, spec) : null;
    } else {
      let children = await query(rel.model, { ...(spec.where || {}), [rel.fk]: row.id });
      children = sortRows(children, spec.orderBy);
      if (spec.skip) children = children.slice(spec.skip);
      if (spec.take != null) children = children.slice(0, spec.take);
      result[name] = await Promise.all(children.map((c) => shape(rel.model, c, spec)));
    }
  }

  const countSel = args?.select?._count?.select || args?.include?._count?.select;
  if (countSel) {
    result._count = {};
    for (const name of Object.keys(countSel)) {
      const rel = def.relations[name];
      result._count[name] = (await query(rel.model, { [rel.fk]: row.id })).length;
    }
  }

  if (fieldSelect) {
    const picked: any = {};
    for (const k of Object.keys(fieldSelect)) picked[k] = result[k];
    for (const k of Object.keys(relSpec)) picked[k] = result[k];
    if (result._count) picked._count = result._count;
    return picked;
  }
  return result;
}

function toWrite(data: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    if (v && typeof v === 'object' && !(v instanceof Date)) {
      if ('increment' in v) { out[k] = FieldValue.increment(v.increment); continue; }
      if ('decrement' in v) { out[k] = FieldValue.increment(-v.decrement); continue; }
      if ('set' in v) { out[k] = v.set; continue; }
    }
    out[k] = v;
  }
  return out;
}

async function createRow(model: string, data: Record<string, any>) {
  const def = MODELS[model];
  const doc = clean({ ...def.defaults(), ...data });
  const id = String(doc.id || randomUUID());
  delete doc.id;
  if (doc.updatedAt === undefined && 'updatedAt' in def.defaults()) doc.updatedAt = now();
  await db().collection(def.collection).doc(id).set(toWrite(doc));
  return fromStore(id, (await db().collection(def.collection).doc(id).get()).data() as any);
}

async function updateRow(model: string, id: string, data: Record<string, any>) {
  const def = MODELS[model];
  const patch: Record<string, any> = toWrite(data);
  delete patch.id;
  if ('updatedAt' in def.defaults() && data.updatedAt === undefined) patch.updatedAt = now();
  await db().collection(def.collection).doc(id).set(patch, { merge: true });
  return getById(model, id);
}

async function deleteRow(model: string, id: string) {
  for (const [child, fk] of CASCADE[model] || []) {
    for (const c of await query(child, { [fk]: id })) await deleteRow(child, c.id);
  }
  await db().collection(MODELS[model].collection).doc(id).delete();
}

function delegate(model: string) {
  const find = async (args: any = {}) => {
    let rows = sortRows(await query(model, args.where), args.orderBy);
    if (args.skip) rows = rows.slice(args.skip);
    if (args.take != null) rows = rows.slice(0, args.take);
    return rows;
  };
  const notFound = () => Object.assign(new Error(`Record not found (${model})`), { code: 'P2025' });
  return {
    findMany: async (args: any = {}) => Promise.all((await find(args)).map((r) => shape(model, r, args))),
    findFirst: async (args: any = {}) => { const r = (await find({ ...args, take: 1 }))[0]; return r ? shape(model, r, args) : null; },
    findUnique: async (args: any) => { const r = (await find({ where: args.where, take: 1 }))[0]; return r ? shape(model, r, args) : null; },
    findFirstOrThrow: async (args: any = {}) => { const r = (await find({ ...args, take: 1 }))[0]; if (!r) throw notFound(); return shape(model, r, args); },
    findUniqueOrThrow: async (args: any) => { const r = (await find({ where: args.where, take: 1 }))[0]; if (!r) throw notFound(); return shape(model, r, args); },
    create: async (args: any) => shape(model, await createRow(model, args.data), args),
    createMany: async (args: any) => {
      const list = ([] as any[]).concat(args.data);
      for (const d of list) await createRow(model, d);
      return { count: list.length };
    },
    update: async (args: any) => {
      const r = (await find({ where: args.where, take: 1 }))[0];
      if (!r) throw notFound();
      return shape(model, await updateRow(model, r.id, args.data), args);
    },
    updateMany: async (args: any) => {
      const rows = await find({ where: args.where });
      for (const r of rows) await updateRow(model, r.id, args.data);
      return { count: rows.length };
    },
    upsert: async (args: any) => {
      const r = (await find({ where: args.where, take: 1 }))[0];
      if (r) return shape(model, await updateRow(model, r.id, args.update || {}), args);
      const base = Object.fromEntries(Object.entries(args.where).filter(([, v]) => !isOp(v)));
      return shape(model, await createRow(model, { ...base, ...args.create }), args);
    },
    delete: async (args: any) => {
      const r = (await find({ where: args.where, take: 1 }))[0];
      if (!r) throw notFound();
      await deleteRow(model, r.id);
      return r;
    },
    deleteMany: async (args: any = {}) => {
      const rows = await find({ where: args.where });
      for (const r of rows) await deleteRow(model, r.id);
      return { count: rows.length };
    },
    count: async (args: any = {}) => (await find({ where: args.where })).length,
    aggregate: async (args: any = {}) => {
      const rows = await find({ where: args.where });
      const out: any = {};
      if (args._count) out._count = rows.length;
      for (const agg of ['_sum', '_avg', '_min', '_max']) {
        if (!args[agg]) continue;
        out[agg] = {};
        for (const f of Object.keys(args[agg])) {
          const vals = rows.map((r) => r[f]).filter((x) => typeof x === 'number');
          out[agg][f] = !vals.length ? null
            : agg === '_sum' ? vals.reduce((a, b) => a + b, 0)
            : agg === '_avg' ? vals.reduce((a, b) => a + b, 0) / vals.length
            : agg === '_min' ? Math.min(...vals) : Math.max(...vals);
        }
      }
      return out;
    },
  };
}

const client: any = {};
for (const m of Object.keys(MODELS)) client[m] = delegate(m);
client.$disconnect = async () => {};
client.$connect = async () => {};
client.$transaction = async (arg: any) => {
  if (typeof arg === 'function') return arg(client);
  return Promise.all(arg);
};

const prisma = client as Record<string, any> & {
  $transaction: <T = any>(arg: ((tx: any) => Promise<T>) | Promise<any>[]) => Promise<any>;
  $disconnect: () => Promise<void>;
};
export default prisma;
