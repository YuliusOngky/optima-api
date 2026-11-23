/**
 * Update imageUrls di DB agar cocok dengan nama produk.
 *   npx tsx scripts/fix-product-images.ts
 */
import { PrismaClient } from '@prisma/client';
import { PRODUCT_IMAGES } from '../prisma/product-images';

const prisma = new PrismaClient();

async function main() {
  let updated = 0;
  let missing = 0;
  for (const [slug, imageUrls] of Object.entries(PRODUCT_IMAGES)) {
    const res = await prisma.product.updateMany({
      where: { slug },
      data: { imageUrls },
    });
    if (res.count > 0) {
      updated += res.count;
      console.log(`OK  ${slug}`);
    } else {
      missing += 1;
      console.log(`MISS ${slug}`);
    }
  }
  console.log(`\nUpdated ${updated} rows, ${missing} slugs not found.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
