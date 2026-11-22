import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting corarevanilla database seeding...');

  // 1. Initialize System Settings
  await prisma.systemSetting.upsert({
    where: { id: 'default' },
    update: {
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
    },
    create: {
      id: 'default',
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
    },
  });
  console.log('✅ System Settings initialized for corarevanilla (IP: corarevanilla.xyz)');

  // 2. Admin User
  const adminPassword = await bcrypt.hash('admin123456', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      role: 'ADMIN',
      password: adminPassword,
      balance: 99999,
      isLinked: true,
      uuid: '8667ba71-b85a-4004-af54-457a9734eed7',
    },
  });
  console.log('✅ Admin user created/verified (admin / admin123456)');

  // Sample Player
  await prisma.user.upsert({
    where: { username: 'CorarePlayer' },
    update: {},
    create: {
      username: 'CorarePlayer',
      role: 'USER',
      balance: 300,
      isLinked: true,
      uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5',
    },
  });

  // 3. Clear old non-smp servers to have ONLY SMP
  await prisma.orderItem.deleteMany({});
  await prisma.commandQueue.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.gameServer.deleteMany({});

  // Create ONLY "corarevanilla SMP"
  const smpServer = await prisma.gameServer.create({
    data: {
      name: 'corarevanilla SMP',
      slug: 'smp',
      description: 'เซิร์ฟเวอร์ Survival SMP แท้ คอมมูนิตี้เอาชีวิตรอด สร้างบ้าน ทำฟาร์ม ค้าขาย สนุกไปกับเพื่อนๆ',
      icon: '🌲',
      banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      rconHost: 'corarevanilla.xyz',
      rconPort: 25575,
      rconPassword: '',
      isActive: true,
    },
  });
  console.log('✅ Created single server: corarevanilla SMP');

  // 4. Create Categories for SMP
  const catRanks = await prisma.category.create({
    data: {
      name: 'ยศสนับสนุน (VIP Ranks)',
      slug: 'vip',
      icon: 'Crown',
      serverId: smpServer.id,
      order: 1,
    },
  });

  const catKeys = await prisma.category.create({
    data: {
      name: 'กุญแจกล่องสุ่ม (Crate Keys)',
      slug: 'keys',
      icon: 'Key',
      serverId: smpServer.id,
      order: 2,
    },
  });

  const catClaims = await prisma.category.create({
    data: {
      name: 'โพรเทกต์ & แคลมบล็อก (Claim Blocks)',
      slug: 'claims',
      icon: 'LandPlot',
      serverId: smpServer.id,
      order: 3,
    },
  });

  const catItems = await prisma.category.create({
    data: {
      name: 'ไอเทม & ของจำเป็น (Survival Items)',
      slug: 'items',
      icon: 'Shield',
      serverId: smpServer.id,
      order: 4,
    },
  });

  // 5. Products for SMP
  const products = [
    {
      name: 'ยศ [SMP VIP] ถาวร',
      description: 'สิทธิพิเศษ: ตั้งจุดบ้านได้ 5 จุด (/sethome 1-5), คำสั่ง /workbench และ /anvil พกพา, พิมพ์สีในแชท, เข้าเซิร์ฟตอนเต็มได้, สัญลักษณ์ [VIP] สีฟ้าอ่อนสุดเท่!',
      price: 150,
      originalPrice: 199,
      image: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
      serverId: smpServer.id,
      categoryId: catRanks.id,
      commands: JSON.stringify([
        'lp user %player% parent add smpvip',
        'broadcast &b[Store] &fขอขอบคุณ &3%player% &fที่สนับสนุนเซิร์ฟเวอร์ด้วยยศ &b[SMP VIP]!',
      ]),
      isFeatured: true,
    },
    {
      name: 'ยศ [SMP MVP] ถาวร',
      description: 'สิทธิพิเศษสูงสุด: สิทธิประโยชน์ทุกอย่างของ VIP + ตั้งจุดบ้านได้ 15 จุด, คำสั่ง /ec, /hat, /feed, คูลดาวน์วาปลดลง 50%, ป้องกันการตกของเมื่อเสียชีวิต 3 ครั้งต่อสัปดาห์',
      price: 350,
      originalPrice: 450,
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
      serverId: smpServer.id,
      categoryId: catRanks.id,
      commands: JSON.stringify([
        'lp user %player% parent add smpmvp',
        'broadcast &b★ [Store] &e%player% &bได้อัปเกรดยศเป็นระดับสูงสุด &3[SMP MVP] &bขอบคุณสำหรับการสนับสนุน!',
      ]),
      isFeatured: true,
    },
    {
      name: 'กุญแจ Crate Key x5 ดอก',
      description: 'กุญแจสำหรับเปิดกล่องสุ่ม Crate ในสปอว์น โอกาสได้รับแร่เนเธอร์ไรท์, อาวุธเอนชานต์พิเศษ, ปีก Elytra และไอเทมก่อสร้างจำนวนมาก',
      price: 90,
      originalPrice: 120,
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      serverId: smpServer.id,
      categoryId: catKeys.id,
      commands: JSON.stringify([
        'crate give %player% smp 5',
        'msg %player% &bคุณได้รับ Crate Key x5 เรียบร้อยแล้ว!',
      ]),
      isFeatured: true,
    },
    {
      name: 'กุญแจ Crate Key x10 ดอก (แพ็กสุดคุ้ม)',
      description: 'กุญแจกล่องสุ่ม 10 ดอก ประหยัดกว่าซื้อแยก 25% สุ่มรับแร่ทอง แร่เพชร และหนังสือเอนชานต์ระดับสูง',
      price: 160,
      originalPrice: 200,
      image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
      serverId: smpServer.id,
      categoryId: catKeys.id,
      commands: JSON.stringify([
        'crate give %player% smp 10',
        'msg %player% &bคุณได้รับ Crate Key x10 เรียบร้อยแล้ว!',
      ]),
      isFeatured: false,
    },
    {
      name: 'ขยายพื้นที่เคลมบ้าน +10,000 Claim Blocks',
      description: 'เพิ่มโควตาเคลมบล็อกทันที 10,000 บล็อก ปกป้องบ้านและฟาร์มของคุณ ป้องกันการขโมยของและป้องกันกริฟ 100%',
      price: 80,
      originalPrice: null,
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
      serverId: smpServer.id,
      categoryId: catClaims.id,
      commands: JSON.stringify([
        'adjustbonusclaimblocks %player% 10000',
        'msg %player% &bเพิ่ม Claim Blocks จำนวน 10,000 บล็อก ให้คุณเรียบร้อยแล้ว!',
      ]),
      isFeatured: true,
    },
    {
      name: 'ขยายพื้นที่เคลมบ้าน +25,000 Claim Blocks (แพ็กใหญ่)',
      description: 'เหมาะสำหรับกิลด์หรือฟาร์มขนาดใหญ่ เพิ่มพื้นที่ดินโพรเทกต์ถึง 25,000 บล็อก สร้างอาณาจักรของคุณได้ตามใจชอบ',
      price: 180,
      originalPrice: 220,
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
      serverId: smpServer.id,
      categoryId: catClaims.id,
      commands: JSON.stringify([
        'adjustbonusclaimblocks %player% 25000',
        'msg %player% &bเพิ่ม Claim Blocks จำนวน 25,000 บล็อก ให้คุณเรียบร้อยแล้ว!',
      ]),
      isFeatured: false,
    },
    {
      name: 'เซ็ตเกราะ Netherite God Set (Protection IV + Mending)',
      description: 'ชุดเกราะเนเธอร์ไรท์ครบเซ็ต 4 ชิ้น พร้อมเอนชานต์ Protection IV, Unbreaking III, Mending ครบสูตรพร้อมผจญภัยทันที!',
      price: 200,
      originalPrice: null,
      image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
      serverId: smpServer.id,
      categoryId: catItems.id,
      commands: JSON.stringify([
        'give %player% netherite_helmet{Enchantments:[{id:"protection",lvl:4},{id:"unbreaking",lvl:3},{id:"mending",lvl:1}]} 1',
        'give %player% netherite_chestplate{Enchantments:[{id:"protection",lvl:4},{id:"unbreaking",lvl:3},{id:"mending",lvl:1}]} 1',
        'give %player% netherite_leggings{Enchantments:[{id:"protection",lvl:4},{id:"unbreaking",lvl:3},{id:"mending",lvl:1}]} 1',
        'give %player% netherite_boots{Enchantments:[{id:"protection",lvl:4},{id:"unbreaking",lvl:3},{id:"mending",lvl:1}]} 1',
      ]),
      isFeatured: true,
    },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }
  console.log(`✅ Created ${products.length} products for corarevanilla SMP`);

  // 6. Promotions
  await prisma.promotion.deleteMany({});
  await prisma.promotion.createMany({
    data: [
      {
        title: '💎 ยินดีต้อนรับสู่ corarevanilla SMP!',
        subtitle: 'เซิร์ฟเวอร์มายคราฟเอาชีวิตรอด คอมมูนิตี้แท้ ลดราคายศและแพ็กเกจพื้นที่เคลมสูงสุด 25%',
        badge: 'CORARE SMP',
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        link: '/store?server=smp',
        order: 1,
        isActive: true,
      },
      {
        title: '⚡ เติมเงิน TrueMoney Wallet รับโบนัส Point เพิ่มทันที!',
        subtitle: 'ทุกยอดเติมเงินผ่านซองของขวัญทรูมันนี่ วอลเล็ท รับแต้ม Point เพิ่มสูงสุด 250 Points ทันทีแบบไม่ต้องรอลุ้น',
        badge: 'TOPUP BONUS',
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
        link: '/topup',
        order: 2,
        isActive: true,
      },
    ],
  });

  // 7. News
  await prisma.news.deleteMany({});
  await prisma.news.createMany({
    data: [
      {
        title: 'ยินดีต้อนรับสู่เซิร์ฟเวอร์ corarevanilla SMP (IP: corarevanilla.xyz)',
        excerpt: 'เปิดให้บริการอย่างเป็นทางการแล้วสำหรับเซิร์ฟเวอร์ Survival SMP คอมมูนิตี้เอาชีวิตรอดแท้ พร้อมระบบร้านค้าอัตโนมัติ!',
        content: `ขอต้อนรับผู้เล่นทุกท่านเข้าสู่เซิร์ฟเวอร์ corarevanilla SMP!\n\nข้อมูลการเชื่อมต่อ:\n- Server IP: corarevanilla.xyz\n- Version: Minecraft 1.20+ / 1.21+\n\nจุดเด่นของเซิร์ฟเวอร์:\n1. ระบบผูกบัญชีด้วยคำสั่ง /link ในเกมโดยตรง ปลอดภัย 100%\n2. ระบบเติมเงิน TrueMoney Wallet อัตโนมัติ ได้แต้มทันที\n3. การซื้อสินค้าส่งของเข้าตัวละครทันทีไม่ต้องรอแอดมินออน\n\nสามารถร่วมพูดคุยกับเพื่อนๆ ใน Discord ได้ที่: https://discord.gg/corarevanilla`,
        category: 'ประกาศ',
        coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      },
    ],
  });

  // 8. Recent Purchases
  await prisma.recentPurchase.deleteMany({});
  await prisma.recentPurchase.createMany({
    data: [
      {
        username: 'CorarePlayer',
        uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5',
        productName: 'ยศ [SMP VIP] ถาวร',
        serverName: 'corarevanilla SMP',
        price: 150,
      },
      {
        username: 'Steve',
        uuid: '8667ba71-b85a-4004-af54-457a9734eed7',
        productName: 'กุญแจ Crate Key x5 ดอก',
        serverName: 'corarevanilla SMP',
        price: 90,
      },
    ],
  });

  console.log('🎉 Seeding corarevanilla SMP completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
