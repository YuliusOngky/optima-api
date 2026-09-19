// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function createAuthUser(email: string, password: string, name: string, role: 'BUYER' | 'SELLER' | 'ADMIN') {
  // Coba buat di Supabase Auth
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  });

  if (error && !error.message.includes('already been registered')) {
    console.warn(`  ⚠️  Auth user ${email}: ${error.message}`);
  }

  const authId = data?.user?.id;

  // Upsert di public.User — pakai authId kalau berhasil, fallback ke UUID random
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, role },
    create: {
      id: authId ?? undefined,
      email,
      name,
      role,
    },
  });

  return user;
}

function toSlug(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('🌱 Seeding Optima Store database...');

  // ─── Demo Users (Supabase Auth + public.User) ──────────────
  console.log('👤 Creating demo users...');
  await createAuthUser('demo@gmail.com', '123456', 'Demo Buyer', 'BUYER');
  await createAuthUser('seller.demo@gmail.com', '123456', 'Demo Seller', 'SELLER');
  await createAuthUser('admin@optimastore.id', 'Admin@123', 'Admin Optima', 'ADMIN');
  console.log('✅ Demo users created');
  console.log('   🛍️  Buyer : demo@gmail.com / 123456');
  console.log('   🏪  Seller: seller.demo@gmail.com / 123456');
  console.log('   🔑  Admin : admin@optimastore.id / Admin@123');

  // ─── Categories ───────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: 'elektronik' }, update: {}, create: { name: 'Elektronik', slug: 'elektronik', icon: '📱' } }),
    prisma.category.upsert({ where: { slug: 'fashion' }, update: {}, create: { name: 'Fashion', slug: 'fashion', icon: '👗' } }),
    prisma.category.upsert({ where: { slug: 'rumah-tangga' }, update: {}, create: { name: 'Rumah Tangga', slug: 'rumah-tangga', icon: '🏠' } }),
    prisma.category.upsert({ where: { slug: 'olahraga' }, update: {}, create: { name: 'Olahraga', slug: 'olahraga', icon: '⚽' } }),
    prisma.category.upsert({ where: { slug: 'kecantikan' }, update: {}, create: { name: 'Kecantikan', slug: 'kecantikan', icon: '💄' } }),
    prisma.category.upsert({ where: { slug: 'otomotif' }, update: {}, create: { name: 'Otomotif', slug: 'otomotif', icon: '🚗' } }),
    prisma.category.upsert({ where: { slug: 'makanan' }, update: {}, create: { name: 'Makanan', slug: 'makanan', icon: '🍜' } }),
    prisma.category.upsert({ where: { slug: 'buku' }, update: {}, create: { name: 'Buku', slug: 'buku', icon: '📚' } }),
  ]);
  console.log(`✅ ${categories.length} categories seeded`);

  const [elekt, fash, rumah, olah, kec, oto, makan, buku] = categories;

  // ─── Sellers ──────────────────────────────────────────────
  const sellersData = [
    { name: 'TechVision Store', city: 'Jakarta Selatan', rating: 4.9 },
    { name: 'GadgetHub Official', city: 'Surabaya', rating: 4.8 },
    { name: 'FashionKita', city: 'Bandung', rating: 4.7 },
    { name: 'HomeDecor Pro', city: 'Yogyakarta', rating: 4.8 },
    { name: 'SportZone', city: 'Semarang', rating: 4.6 },
    { name: 'BeautyLab', city: 'Bali', rating: 4.9 },
    { name: 'AutomotivePlus', city: 'Medan', rating: 4.5 },
    { name: 'KulinerNusantara', city: 'Makassar', rating: 4.7 },
    { name: 'BookWorld', city: 'Malang', rating: 4.8 },
    { name: 'ElektroMax', city: 'Bekasi', rating: 4.6 },
    { name: 'StyleMania', city: 'Tangerang', rating: 4.5 },
    { name: 'FurnitureKraft', city: 'Solo', rating: 4.7 },
  ];

  for (let i = 0; i < sellersData.length; i++) {
    const s = sellersData[i];
    const email = `seller${i + 1}@optimastore.id`;
    const slug = toSlug(s.name);
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name: s.name, role: 'SELLER' },
    });
    await prisma.seller.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: s.name,
        slug,
        city: s.city,
        rating: s.rating,
        isActive: true,
      },
    });
  }
  // Buat Seller row untuk demo seller
  const demoSellerUser = await prisma.user.findUnique({ where: { email: 'seller.demo@gmail.com' } });
  if (demoSellerUser) {
    await prisma.seller.upsert({
      where: { userId: demoSellerUser.id },
      update: {},
      create: {
        userId: demoSellerUser.id,
        name: 'Demo Seller Store',
        slug: 'demo-seller-store',
        city: 'Jakarta Pusat',
        rating: 5.0,
        isActive: true,
      },
    });
  }
  console.log('✅ 12 sellers + 1 demo seller seeded');

  const sellers = await prisma.seller.findMany();
  const sellerMap = new Map(sellers.map(s => [s.name, s]));
  const getSeller = (name: string) => {
    const s = sellerMap.get(name);
    if (!s) throw new Error(`Seller not found: ${name}`);
    return s;
  };

  // ─── Products ──────────────────────────────────────────────
  const productsData = [
    // Elektronik
    { name: 'Samsung Galaxy S24 Ultra 256GB', price: 18999000, origPrice: 21000000, rating: 4.9, totalSold: 3200, badge: 'disc', category: elekt, seller: 'TechVision Store', description: 'Flagship Samsung terbaru dengan S-Pen, kamera 200MP, dan Snapdragon 8 Gen 3.' },
    { name: 'iPhone 15 Pro Max 256GB', price: 21499000, origPrice: 23000000, rating: 4.9, totalSold: 2800, badge: 'disc', category: elekt, seller: 'TechVision Store', description: 'iPhone terkuat dengan chip A17 Pro, kamera 48MP, dan layar ProMotion 120Hz.' },
    { name: 'Laptop ASUS ROG Zephyrus G14', price: 22999000, origPrice: 25000000, rating: 4.8, totalSold: 1500, badge: 'disc', category: elekt, seller: 'GadgetHub Official', description: 'Gaming laptop tipis AMD Ryzen 9 + RTX 4060 untuk performa maksimal.' },
    { name: 'MacBook Air M3 13 256GB', price: 16499000, origPrice: 18000000, rating: 4.9, totalSold: 1800, badge: 'disc', category: elekt, seller: 'TechVision Store', description: 'MacBook ultra-tipis dengan chip M3, baterai 18 jam, dan layar Liquid Retina.' },
    { name: 'iPad Pro 11 M4 256GB WiFi', price: 13999000, origPrice: 15000000, rating: 4.8, totalSold: 900, badge: 'disc', category: elekt, seller: 'GadgetHub Official', description: 'iPad pro terkuat dengan chip M4, layar Tandem OLED, dan Apple Pencil Pro ready.' },
    { name: 'Sony WH-1000XM5 Wireless Headphone', price: 4699000, origPrice: 5500000, rating: 4.9, totalSold: 4500, badge: 'disc', category: elekt, seller: 'ElektroMax', description: 'Headphone ANC terbaik di kelasnya dengan 30 jam baterai dan suara jernih.' },
    { name: 'DJI Mini 4 Pro Drone', price: 9499000, origPrice: 10500000, rating: 4.8, totalSold: 650, badge: 'disc', category: elekt, seller: 'GadgetHub Official', description: 'Drone 4K/60fps sub-250g dengan obstacle avoidance 360° dan ActiveTrack 360.' },
    { name: 'Samsung 65 QLED 4K Smart TV', price: 12999000, origPrice: 15500000, rating: 4.7, totalSold: 750, badge: 'disc', category: elekt, seller: 'ElektroMax', description: 'TV QLED 4K dengan Quantum HDR+ dan Neo Quantum Processor 4K.' },
    { name: 'ASUS ROG Phone 8 Pro 16/512GB', price: 13999000, origPrice: 15000000, rating: 4.8, totalSold: 420, badge: 'disc', category: elekt, seller: 'GadgetHub Official', description: 'Gaming phone dengan Snapdragon 8 Gen 3, layar 165Hz, dan pendingin AeroActive.' },
    { name: 'Xiaomi 14 Ultra 16/512GB', price: 15999000, origPrice: 17500000, rating: 4.7, totalSold: 380, badge: 'hot', category: elekt, seller: 'TechVision Store', description: 'Flagship Xiaomi dengan kamera Leica 1-inch sensor dan Snapdragon 8 Gen 3.' },

    // Fashion
    { name: 'Nike Air Max 270 React', price: 1899000, origPrice: 2200000, rating: 4.8, totalSold: 6800, badge: 'disc', category: fash, seller: 'StyleMania', description: 'Sneaker Nike ikonik dengan teknologi Air Max dan React foam untuk kenyamanan maksimal.' },
    { name: 'Jaket Bomber Kulit Pria Premium', price: 899000, origPrice: 1200000, rating: 4.6, totalSold: 3200, badge: 'disc', category: fash, seller: 'FashionKita', description: 'Jaket bomber kulit PU premium dengan inner fleece hangat, cocok untuk segala cuaca.' },
    { name: 'Dress Batik Modern Wanita', price: 449000, origPrice: 650000, rating: 4.7, totalSold: 5100, badge: 'disc', category: fash, seller: 'FashionKita', description: 'Dress batik tulis motif kawung kombinasi modern yang elegan dan nyaman dipakai.' },
    { name: 'Adidas Ultraboost 22 Running', price: 2199000, origPrice: 2800000, rating: 4.8, totalSold: 4200, badge: 'disc', category: fash, seller: 'StyleMania', description: 'Sepatu lari Adidas dengan Boost cushioning dan Primeknit upper ultra-ringan.' },
    { name: 'Kemeja Flannel Kasual Pria', price: 249000, origPrice: 350000, rating: 4.5, totalSold: 7800, badge: 'disc', category: fash, seller: 'FashionKita', description: 'Kemeja flannel tebal berkualitas dengan motif kotak-kotak, cocok untuk casual wear.' },
    { name: 'Tas Kulit Wanita Branded Look', price: 1199000, origPrice: 1600000, rating: 4.7, totalSold: 2900, badge: 'disc', category: fash, seller: 'FashionKita', description: 'Tas tote kulit PU premium dengan desain minimalis yang elegan dan ruang luas.' },
    { name: 'Celana Chino Slim Fit Pria', price: 299000, origPrice: 420000, rating: 4.6, totalSold: 9200, badge: 'disc', category: fash, seller: 'StyleMania', description: 'Celana chino bahan stretch premium yang nyaman dan rapi untuk tampilan kasual formal.' },
    { name: 'Hijab Segi Empat Premium Voal', price: 129000, origPrice: 180000, rating: 4.8, totalSold: 15000, badge: 'hot', category: fash, seller: 'FashionKita', description: 'Hijab segi empat motif printing full color dengan bahan voal anti-kusut berkualitas.' },

    // Rumah Tangga
    { name: 'Dyson V15 Detect Cordless Vacuum', price: 9999000, origPrice: 11500000, rating: 4.9, totalSold: 680, badge: 'disc', category: rumah, seller: 'HomeDecor Pro', description: 'Vacuum cleaner nirkabel Dyson dengan laser detection dan HEPA filtration 99.99%.' },
    { name: 'Meja Makan Kayu Jati Solid 4 Kursi', price: 4999000, origPrice: 6500000, rating: 4.8, totalSold: 320, badge: 'disc', category: rumah, seller: 'FurnitureKraft', description: 'Set meja makan kayu jati solid ukiran Jepara 4 kursi, tahan lama dan elegan.' },
    { name: 'Rice Cooker Zojirushi 1.8L', price: 2299000, origPrice: 2800000, rating: 4.9, totalSold: 5400, badge: 'disc', category: rumah, seller: 'HomeDecor Pro', description: 'Rice cooker premium Jepang dengan teknologi induction heating untuk nasi sempurna.' },
    { name: 'AC Sharp 1PK Inverter WiFi', price: 4599000, origPrice: 5200000, rating: 4.7, totalSold: 1200, badge: 'disc', category: rumah, seller: 'ElektroMax', description: 'AC inverter hemat energi dengan kontrol WiFi dan self-cleaning filter.' },
    { name: 'Kasur Spring Bed King Koil 160x200', price: 8999000, origPrice: 11000000, rating: 4.8, totalSold: 450, badge: 'disc', category: rumah, seller: 'FurnitureKraft', description: 'Kasur spring bed premium dengan teknologi pocket spring dan foam memory comfort.' },
    { name: 'Blender Philips ProBlend 9 Series', price: 1899000, origPrice: 2300000, rating: 4.7, totalSold: 3200, badge: 'disc', category: rumah, seller: 'HomeDecor Pro', description: 'Blender high-speed 2000W dengan pisau ProBlend 6 yang kuat untuk smoothie sempurna.' },

    // Olahraga
    { name: 'Sepeda Gunung Polygon Xtrada 7', price: 8999000, origPrice: 10500000, rating: 4.8, totalSold: 280, badge: 'disc', category: olah, seller: 'SportZone', description: 'MTB hardtail 27.5" dengan suspensi RockShox Judy dan komponen Shimano Deore.' },
    { name: 'Treadmill Motorized NordicTrack T6.5', price: 12999000, origPrice: 15000000, rating: 4.7, totalSold: 180, badge: 'disc', category: olah, seller: 'SportZone', description: 'Treadmill premium dengan layar touchscreen 10" dan koneksi iFit untuk latihan interaktif.' },
    { name: 'Dumbbell Set 40kg Adjustable', price: 1299000, origPrice: 1800000, rating: 4.6, totalSold: 2100, badge: 'disc', category: olah, seller: 'SportZone', description: 'Set barbel adjustable 40kg dengan material iron casting berkualitas dan grip anti-slip.' },
    { name: 'Sepatu Futsal Nike Tiempo Legend 10', price: 1499000, origPrice: 1900000, rating: 4.8, totalSold: 4500, badge: 'disc', category: olah, seller: 'SportZone', description: 'Sepatu futsal Nike kulit kangaroo asli dengan outsole NikeSkin untuk kontrol bola terbaik.' },
    { name: 'Raket Badminton Yonex Astrox 88S', price: 1999000, origPrice: 2500000, rating: 4.9, totalSold: 1800, badge: 'disc', category: olah, seller: 'SportZone', description: 'Raket badminton professional Yonex dengan teknologi Rotational Generator System.' },

    // Kecantikan
    { name: 'Serum Vitamin C Skinceuticals CE Ferulic', price: 2499000, origPrice: 3000000, rating: 4.9, totalSold: 2100, badge: 'disc', category: kec, seller: 'BeautyLab', description: 'Serum vitamin C anti-aging dengan formula patented CE Ferulic untuk glowing skin.' },
    { name: 'Foundation Wardah Perfect Bright', price: 89000, origPrice: 130000, rating: 4.7, totalSold: 28000, badge: 'disc', category: kec, seller: 'BeautyLab', description: 'Foundation lokal terbaik dengan SPF 28 dan coverage medium buildable yang ringan.' },
    { name: 'Parfum Maison Margiela Replica', price: 1899000, origPrice: 2300000, rating: 4.8, totalSold: 890, badge: 'disc', category: kec, seller: 'BeautyLab', description: 'Eau de Toilette mewah dengan aroma By The Fireplace yang hangat dan elegan.' },
    { name: 'Sunscreen Skin Aqua UV Mild Gel SPF50', price: 59000, origPrice: 85000, rating: 4.8, totalSold: 45000, badge: 'hot', category: kec, seller: 'BeautyLab', description: 'Sunscreen Jepang ringan non-greasy dengan PA++++ untuk perlindungan UVA/UVB maksimal.' },
    { name: 'Lip Tint Somethinc Stay Berry', price: 69000, origPrice: 99000, rating: 4.6, totalSold: 18000, badge: 'disc', category: kec, seller: 'BeautyLab', description: 'Lip tint lokal tahan lama dengan formula moist yang melembapkan bibir sepanjang hari.' },
    { name: 'Eye Cream LOreal Revitalift Filler', price: 299000, origPrice: 400000, rating: 4.7, totalSold: 5600, badge: 'disc', category: kec, seller: 'BeautyLab', description: 'Eye cream anti-aging dengan hyaluronic acid 1.5% yang mereduksi kerutan dan kantung mata.' },

    // Otomotif
    { name: 'Helm Full Face AGV Pista GP RR', price: 8999000, origPrice: 11000000, rating: 4.9, totalSold: 320, badge: 'disc', category: oto, seller: 'AutomotivePlus', description: 'Helm full face premium Italy dengan sertifikasi FIM Racing dan visor Pinlock 120.' },
    { name: 'Oli Mesin Castrol EDGE 5W-30 4L', price: 499000, origPrice: 650000, rating: 4.8, totalSold: 12000, badge: 'disc', category: oto, seller: 'AutomotivePlus', description: 'Oli mesin full synthetic premium dengan teknologi Fluid Titanium untuk performa optimal.' },
    { name: 'Ban Motor IRC NR77 120/70-17', price: 899000, origPrice: 1100000, rating: 4.7, totalSold: 2800, badge: 'disc', category: oto, seller: 'AutomotivePlus', description: 'Ban radial tubeless sport dengan compound khusus untuk grip maksimal di segala kondisi.' },
    { name: 'GPS Tracker Kendaraan Plug and Play', price: 499000, origPrice: 750000, rating: 4.6, totalSold: 4500, badge: 'disc', category: oto, seller: 'AutomotivePlus', description: 'GPS tracker realtime dengan aplikasi mobile, anti-maling, dan riwayat perjalanan 3 bulan.' },
    { name: 'Dashcam 4K Sony Starvis VIOFO A229 Pro', price: 1799000, origPrice: 2200000, rating: 4.8, totalSold: 1200, badge: 'disc', category: oto, seller: 'AutomotivePlus', description: 'Dashcam depan-belakang 4K+2K dengan night vision dan GPS built-in.' },

    // Makanan
    { name: 'Rendang Daging Sapi Premium 500g', price: 189000, origPrice: 250000, rating: 4.9, totalSold: 8900, badge: 'disc', category: makan, seller: 'KulinerNusantara', description: 'Rendang daging sapi Padang asli dimasak 8 jam dengan 47 rempah pilihan tanpa MSG.' },
    { name: 'Sambal Bawang Emak-Emak 250ml', price: 45000, origPrice: 65000, rating: 4.8, totalSold: 25000, badge: 'hot', category: makan, seller: 'KulinerNusantara', description: 'Sambal bawang goreng homemade super pedas level 10 favorit jutaan pelanggan.' },
    { name: 'Kopi Arabica Gayo Single Origin 250g', price: 129000, origPrice: 175000, rating: 4.9, totalSold: 12000, badge: 'disc', category: makan, seller: 'KulinerNusantara', description: 'Kopi arabica specialty grade Gayo Aceh dengan profil fruity-floral dan keasaman cerah.' },
    { name: 'Snack Box Premium Mix 50pcs', price: 299000, origPrice: 400000, rating: 4.7, totalSold: 6700, badge: 'disc', category: makan, seller: 'KulinerNusantara', description: 'Snack box premium berisi 50 pilihan cemilan khas nusantara untuk hampers.' },
    { name: 'Mie Instan Lokal Premium Box 40pcs', price: 185000, origPrice: 240000, rating: 4.6, totalSold: 31000, badge: 'disc', category: makan, seller: 'KulinerNusantara', description: 'Paket mie instan premium box 40 bungkus berbagai rasa dengan bumbu autentik.' },

    // Buku
    { name: 'Atomic Habits James Clear Terjemahan', price: 129000, origPrice: 179000, rating: 4.9, totalSold: 45000, badge: 'hot', category: buku, seller: 'BookWorld', description: 'Bestseller internasional tentang cara membangun kebiasaan baik dan menghilangkan kebiasaan buruk.' },
    { name: 'Rich Dad Poor Dad Robert Kiyosaki', price: 99000, origPrice: 139000, rating: 4.8, totalSold: 38000, badge: 'disc', category: buku, seller: 'BookWorld', description: 'Buku finansial legendaris tentang cara berpikir dan membangun kebebasan finansial sejak dini.' },
    { name: 'Clean Code Robert C Martin', price: 249000, origPrice: 320000, rating: 4.9, totalSold: 8900, badge: 'disc', category: buku, seller: 'BookWorld', description: 'Panduan essential bagi programmer untuk menulis kode yang bersih, mudah dibaca, dan maintainable.' },
    { name: 'System Design Interview Vol 2', price: 299000, origPrice: 380000, rating: 4.8, totalSold: 4200, badge: 'new', category: buku, seller: 'BookWorld', description: 'Buku persiapan interview system design untuk posisi software engineer senior di perusahaan tech.' },
    { name: 'Filosofi Teras Henry Manampiring', price: 89000, origPrice: 130000, rating: 4.9, totalSold: 52000, badge: 'hot', category: buku, seller: 'BookWorld', description: 'Buku lokal terlaris tentang filosofi Stoa yang relevan dengan kehidupan orang Indonesia modern.' },
  ];

  let productCount = 0;
  for (const p of productsData) {
    const seller = getSeller(p.seller);
    const slug = toSlug(p.name);
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: p.name,
        slug,
        description: p.description,
        price: p.price,
        origPrice: p.origPrice,
        stock: Math.floor(Math.random() * 200) + 50,
        rating: p.rating,
        totalSold: p.totalSold,
        badge: p.badge,
        isActive: true,
        categoryId: p.category.id,
        sellerId: seller.id,
      },
    });
    productCount++;
  }
  console.log(`✅ ${productCount} products seeded`);

  // ─── Banners ──────────────────────────────────────────────
  const bannersData = [
    { title: 'Harbolnas 12.12 Sale Gila-Gilaan!', subtitle: 'Diskon hingga 90% + Cashback 50%', ctaText: 'Belanja Sekarang', imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200', type: 'HERO' as const, sortOrder: 1 },
    { title: 'Flash Sale Elektronik Setiap Hari', subtitle: 'Harga spesial mulai Rp 99.000', ctaText: 'Lihat Flash Sale', imageUrl: 'https://images.unsplash.com/photo-1593640408182-31c228f8c6be?w=1200', type: 'HERO' as const, sortOrder: 2 },
    { title: 'Fashion Week Sale Up To 70%', subtitle: 'Brand lokal dan internasional terbaik', ctaText: 'Shop Now', imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200', type: 'HERO' as const, sortOrder: 3 },
    { title: 'Cashback GoPay 30%', subtitle: 'Min. transaksi Rp 100.000', ctaText: 'Pakai GoPay', imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600', type: 'SIDE' as const, sortOrder: 1 },
    { title: 'Gratis Ongkir Seluruh Indonesia', subtitle: 'Min. belanja Rp 50.000', ctaText: 'Belanja Gratis Ongkir', imageUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600', type: 'SIDE' as const, sortOrder: 2 },
  ];

  // Delete and recreate banners for clean seed
  await prisma.banner.deleteMany();
  await prisma.banner.createMany({
    data: bannersData.map(b => ({
      title: b.title,
      subtitle: b.subtitle,
      ctaText: b.ctaText,
      imageUrl: b.imageUrl,
      type: b.type,
      sortOrder: b.sortOrder,
      isActive: true,
    })),
  });
  console.log('✅ 5 banners seeded');

  console.log('\n🎉 Seeding selesai! Database siap digunakan.');
  console.log('   📊 8 categories | 13 sellers | 53 products | 5 banners');
  console.log('\n🔑 Demo Credentials:');
  console.log('   Buyer  → demo@gmail.com         / 123456');
  console.log('   Seller → seller.demo@gmail.com  / 123456');
  console.log('   Admin  → admin@optimastore.id   / Admin@123');
}

main()
  .catch(e => { console.error('❌ Seed gagal:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
