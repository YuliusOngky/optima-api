/**
 * Gambar demo per slug — diselaraskan dengan nama/deskripsi produk.
 */
const u = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const PRODUCT_IMAGES: Record<string, string[]> = {
  // Elektronik
  'samsung-galaxy-s24-ultra-256gb': [u('photo-1610945415295-77710bdd716a')],
  'iphone-15-pro-max-256gb': [u('photo-1510557880182-3d4d3cba35a5')],
  'laptop-asus-rog-zephyrus-g14': [u('photo-1603302576837-37561b2eadd2')],
  'macbook-air-m3-13-256gb': [u('photo-1517336714731-489689fd1ca8')],
  'ipad-pro-11-m4-256gb-wifi': [u('photo-1544244015-0df4b3ffc6b0')],
  'sony-wh-1000xm5-wireless-headphone': [u('photo-1505740420928-5e560c06d30e')],
  'dji-mini-4-pro-drone': [u('photo-1473968512647-3e447244af8f')],
  'samsung-65-qled-4k-smart-tv': [u('photo-1593359677879-a4bb62b393bb')],
  'asus-rog-phone-8-pro-16-512gb': [u('photo-1592899677977-9c10ca588bbd')],
  'xiaomi-14-ultra-16-512gb': [u('photo-1598327105666-5b89351aff97')],

  // Fashion
  'nike-air-max-270-react': [u('photo-1542291026-7eec264c27ff')],
  'jaket-bomber-kulit-pria-premium': [u('photo-1551028719-00167b16eac5')],
  'dress-batik-modern-wanita': [u('photo-1595777457583-95e059d581b8')],
  'adidas-ultraboost-22-running': [u('photo-1606107557195-0e29a4b5b4aa')],
  'kemeja-flannel-kasual-pria': [u('photo-1602810318383-e386cc2a3ccf')],
  'tas-kulit-wanita-branded-look': [u('photo-1584917865442-de89df76afd3')],
  'celana-chino-slim-fit-pria': [u('photo-1473966968600-fa801b869a1a')],
  'hijab-segi-empat-premium-voal': [u('photo-1583391733956-6c78276477e2')],

  // Rumah tangga
  'dyson-v15-detect-cordless-vacuum': [u('photo-1558317374-067fb5f30001')],
  'meja-makan-kayu-jati-solid-4-kursi': [u('photo-1617806118233-18e1de247200')],
  'rice-cooker-zojirushi-1-8l': [u('photo-1585515320310-259814833e62')],
  'ac-sharp-1pk-inverter-wifi': [u('photo-1621905252507-b35492cc74b4')],
  'kasur-spring-bed-king-koil-160x200': [u('photo-1505693416388-ac8eb95e663b')],
  'blender-philips-problend-9-series': [u('photo-1570222094114-d054a817e56b')],

  // Olahraga
  'sepeda-gunung-polygon-xtrada-7': [u('photo-1576435728678-68d0fbf94e91')],
  'treadmill-motorized-nordictrack-t6-5': [u('photo-1576678927484-cc907957088c')],
  'dumbbell-set-40kg-adjustable': [u('photo-1517836357463-d25dfeac3438')],
  'sepatu-futsal-nike-tiempo-legend-10': [u('photo-1517466787929-bc90951d0974')],
  'raket-badminton-yonex-astrox-88s': [u('photo-1626224583764-f87db24ac4ea')],

  // Kecantikan
  'serum-vitamin-c-skinceuticals-ce-ferulic': [u('photo-1570194065650-d99fb4b38b17')],
  'foundation-wardah-perfect-bright': [u('photo-1596462502278-27bfdc403348')],
  'parfum-maison-margiela-replica': [u('photo-1541643600914-78b084683601')],
  'sunscreen-skin-aqua-uv-mild-gel-spf50': [u('photo-1556228578-0d85b1a4d571')],
  'lip-tint-somethinc-stay-berry': [u('photo-1586495777744-4413f21062fa')],
  'eye-cream-loreal-revitalift-filler': [u('photo-1570172619644-dfd03ed5d881')],

  // Otomotif
  'helm-full-face-agv-pista-gp-rr': [u('photo-1558981806-ec527fa84c39')],
  'oli-mesin-castrol-edge-5w-30-4l': [u('photo-1486262715619-67b85e0b08d3')],
  'ban-motor-irc-nr77-120-70-17': [u('photo-1558981403-c5f9899a28bc')],
  'gps-tracker-kendaraan-plug-and-play': [u('photo-1524661135-423995f22d0b')],
  'dashcam-4k-sony-starvis-viofo-a229-pro': [u('photo-1449965408869-eaa3f722e40d')],

  // Makanan
  'rendang-daging-sapi-premium-500g': [u('photo-1604908176997-125f25cc6f3d')],
  'sambal-bawang-emak-emak-250ml': [u('photo-1596797038530-2c107229654b')],
  'kopi-arabica-gayo-single-origin-250g': [u('photo-1447933601403-0c6688de566e')],
  'snack-box-premium-mix-50pcs': [u('photo-1599490659213-e2b9527bd087')],
  'mie-instan-lokal-premium-box-40pcs': [u('photo-1569718212165-3a8278d5f624')],

  // Buku
  'atomic-habits-james-clear-terjemahan': [u('photo-1544947950-fa07a98d237f')],
  'rich-dad-poor-dad-robert-kiyosaki': [u('photo-1589998059171-988d887df646')],
  'clean-code-robert-c-martin': [u('photo-1532012197267-da84d127e765')],
  'system-design-interview-vol-2': [u('photo-1512820790803-83ca734da794')],
  'filosofi-teras-henry-manampiring': [u('photo-1495446815900-a0bf27447fb2')],
};

export function imageForSlug(slug: string): string[] {
  return PRODUCT_IMAGES[slug] ?? [u('photo-1523275335684-37898b6baf30')];
}
