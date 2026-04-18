import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱  Seeding EVFleet database...');

  // ── Cities ──────────────────────────────────────────────────
  const cities = await Promise.all([
    prisma.city.upsert({
      where: { code: 'DEL' },
      update: {},
      create: { name: 'New Delhi', state: 'Delhi', code: 'DEL' },
    }),
    prisma.city.upsert({
      where: { code: 'GGN' },
      update: {},
      create: { name: 'Gurugram', state: 'Haryana', code: 'GGN' },
    }),
    prisma.city.upsert({
      where: { code: 'FBD' },
      update: {},
      create: { name: 'Faridabad', state: 'Haryana', code: 'FBD' },
    }),
    prisma.city.upsert({
      where: { code: 'NOI' },
      update: {},
      create: { name: 'Noida', state: 'Uttar Pradesh', code: 'NOI' },
    }),
    prisma.city.upsert({
      where: { code: 'MUM' },
      update: {},
      create: { name: 'Mumbai', state: 'Maharashtra', code: 'MUM' },
    }),
    prisma.city.upsert({
      where: { code: 'BLR' },
      update: {},
      create: { name: 'Bengaluru', state: 'Karnataka', code: 'BLR' },
    }),
  ]);
  console.log(`  ✅  ${cities.length} cities`);

  // ── Hubs (2 per city) ───────────────────────────────────────
  const hubsData = [
    // Delhi
    { name: 'Mundka Hub', cityCode: 'DEL', address: 'Mundka Industrial Area, New Delhi' },
    { name: 'Dwarka Hub', cityCode: 'DEL', address: 'Sector 10, Dwarka, New Delhi' },
    // Gurugram
    { name: 'Sector 66 Hub', cityCode: 'GGN', address: 'Sector 66, Gurugram, Haryana' },
    { name: 'Badshahpur Hub', cityCode: 'GGN', address: 'Badshahpur, Gurugram, Haryana' },
    // Faridabad
    { name: 'NIT Hub', cityCode: 'FBD', address: 'NIT Faridabad, Haryana' },
    { name: 'Ballabhgarh Hub', cityCode: 'FBD', address: 'Ballabhgarh, Faridabad, Haryana' },
    // Noida
    { name: 'Sector 62 Hub', cityCode: 'NOI', address: 'Sector 62, Noida, UP' },
    { name: 'Greater Noida Hub', cityCode: 'NOI', address: 'Greater Noida West, UP' },
    // Mumbai
    { name: 'Andheri Hub', cityCode: 'MUM', address: 'Andheri East, Mumbai, Maharashtra' },
    { name: 'Thane Hub', cityCode: 'MUM', address: 'Thane West, Maharashtra' },
    // Bengaluru
    { name: 'Koramangala Hub', cityCode: 'BLR', address: 'Koramangala, Bengaluru, Karnataka' },
    { name: 'Whitefield Hub', cityCode: 'BLR', address: 'Whitefield, Bengaluru, Karnataka' },
  ];

  const cityMap = Object.fromEntries(cities.map((c) => [c.code, c.id]));
  let hubCount = 0;
  for (const h of hubsData) {
    await prisma.hub.upsert({
      where: { id: `seed-hub-${h.name.replace(/\s/g, '-').toLowerCase()}` },
      update: {},
      create: {
        id: `seed-hub-${h.name.replace(/\s/g, '-').toLowerCase()}`,
        name: h.name,
        cityId: cityMap[h.cityCode],
        address: h.address,
      },
    });
    hubCount++;
  }
  console.log(`  ✅  ${hubCount} hubs`);

  // ── B2B Clients ─────────────────────────────────────────────
  const clientsData = [
    { name: 'Zomato', clientCode: 'ZMT001' },
    { name: 'Swiggy', clientCode: 'SWG001' },
    { name: 'Zepto', clientCode: 'ZPT001' },
    { name: 'Blinkit', clientCode: 'BLK001' },
    { name: 'Porter', clientCode: 'PRT001' },
  ];

  let clientCount = 0;
  for (const c of clientsData) {
    await prisma.client.upsert({
      where: { clientCode: c.clientCode },
      update: {},
      create: c,
    });
    clientCount++;
  }
  console.log(`  ✅  ${clientCount} clients`);

  // ── Super Admin user ─────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { phone: '+919999999999' },
    update: {},
    create: {
      phone: '+919999999999',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`  ✅  Super admin: ${admin.phone}`);

  console.log('\n🎉  Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
