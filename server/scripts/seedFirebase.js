// seedFirebase.js - Seeds Firestore collections for corarevanilla SMP
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const admin = require('firebase-admin');

function getDb() {
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  const localKey = path.resolve(__dirname, '../serviceAccountKey.json');
  if (fs.existsSync(localKey)) {
    const cred = JSON.parse(fs.readFileSync(localKey, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(cred) });
    return admin.firestore();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    return admin.firestore();
  }

  throw new Error('No Firebase credentials found. Provide serviceAccountKey.json or set FIREBASE_* env vars.');
}

async function seed() {
  console.log('🌱 Seeding Firebase Firestore for corarevanilla SMP...');
  const db = getDb();

  // 1. Settings
  await db.collection('settings').doc('default').set({
    storeName: 'corarevanilla',
    serverIp: 'corarevanilla.xyz',
    discordUrl: 'https://discord.gg/corarevanilla',
    truemoneyPhone: '0812345678',
    serverSecretKey: 'corare_minecraft_secret_token_change_in_production',
    linkExpiryMinutes: 5,
    maxLinkAttempts: 5,
    rconEnabled: false,
    rconHost: 'corarevanilla.xyz',
    rconPort: 25575,
    rconPassword: '',
    announcement: 'ยินดีต้อนรับสู่ corarevanilla SMP - สังคมเอาชีวิตรอด คอมมูนิตี้มายคราฟแท้ IP: corarevanilla.xyz',
    themeColor: 'light-blue',
    updatedAt: new Date().toISOString(),
  }, { merge: true });
  console.log('✅ Settings seeded');

  // 2. Server (corarevanilla SMP only)
  await db.collection('servers').doc('smp').set({
    id: 'smp',
    name: 'corarevanilla SMP',
    slug: 'smp',
    description: 'เซิร์ฟเวอร์มายคราฟเอาชีวิตรอดแบบแท้ (Survival Multiplayer) ไร้มอด สังคมคุณภาพ',
    icon: '💎',
    ip: 'corarevanilla.xyz',
    port: 25565,
    rconHost: 'corarevanilla.xyz',
    rconPort: 25575,
    rconPassword: '',
    isActive: true,
  }, { merge: true });
  console.log('✅ Server corarevanilla SMP seeded');

  // 3. Products
  const products = [
    {
      id: 'prod-vip',
      name: 'VIP Rank (ยศ VIP ถาวร)',
      slug: 'vip-rank',
      price: 250,
      serverId: 'smp',
      category: 'rank',
      description: 'ยศพิเศษ VIP สิทธิบินในเกาะส่วนตัว ตั้งวาปเพิ่ม 3 จุด สัญลักษณ์นำหน้าชื่อสีเขียวมรกต',
      icon: 'Crown',
      commands: ['lp user %player% parent add vip', 'broadcast &8[&bCorare&fVanilla&8] &e%player% &aได้รับยศ &a&lVIP &aถาวร! ขอบคุณสำหรับการสนับสนุนเซิร์ฟเวอร์'],
      isFeatured: true,
    },
    {
      id: 'prod-mvp',
      name: 'MVP Rank (ยศ MVP ถาวร)',
      slug: 'mvp-rank',
      price: 550,
      serverId: 'smp',
      category: 'rank',
      description: 'ยศระดับสูง MVP สิทธิพิเศษครบถ้วน วาปได้ 10 จุด เข้าเซิร์ฟเวอร์ได้แม้ห้องเต็ม คำสั่งแต่งตัว /hat, /glow',
      icon: 'Sparkles',
      commands: ['lp user %player% parent add mvp', 'broadcast &8[&bCorare&fVanilla&8] &e%player% &6ได้รับยศ &6&lMVP &6ถาวร! ขอขอบคุณอย่างยิ่ง'],
      isFeatured: true,
    },
    {
      id: 'prod-keys-10',
      name: 'กุญแจ Crate Key x10 ดอก',
      slug: 'crate-key-10',
      price: 100,
      serverId: 'smp',
      category: 'keys',
      description: 'กุญแจสุ่มกล่องไอเทมแรร์ 10 ดอก โอกาสได้ไอเทมพิเศษ แร่เพชร อาวุธ และเครื่องประดับ',
      icon: 'Key',
      commands: ['crazycrates give p rare 10 %player%'],
      isFeatured: true,
    },
  ];

  for (const p of products) {
    await db.collection('products').doc(p.id).set(p, { merge: true });
  }
  console.log(`✅ ${products.length} Products seeded`);

  // 4. Redeem codes
  await db.collection('redeemCodes').doc('CORARE2026').set({
    code: 'CORARE2026',
    rewardPoints: 50,
    maxUses: 1000,
    timesUsed: 0,
    isActive: true,
    expiresAt: null,
  }, { merge: true });
  console.log('✅ Redeem code CORARE2026 seeded');

  console.log('🎉 Firebase Firestore seeding completed successfully!');
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  process.exit(1);
});
