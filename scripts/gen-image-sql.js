const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(
  path.join(__dirname, "..", "prisma", "product-images.ts"),
  "utf8",
);
const map = {};
const re = /'([^']+)':\s*\[u\('([^']+)'\)\]/g;
let m;
while ((m = re.exec(src))) {
  map[m[1]] =
    "https://images.unsplash.com/" + m[2] + "?auto=format&fit=crop&w=800&q=80";
}
let sql = "BEGIN;\n";
for (const [slug, url] of Object.entries(map)) {
  const safe = url.replace(/'/g, "''");
  sql += `UPDATE products SET "imageUrls" = ARRAY['${safe}']::text[], "updatedAt" = NOW() WHERE slug = '${slug}';\n`;
}
sql += 'COMMIT;\nSELECT slug, "imageUrls"[1] AS img FROM products ORDER BY id LIMIT 8;\n';
const out = path.join(__dirname, "fix-product-images.sql");
fs.writeFileSync(out, sql);
console.log("mapped", Object.keys(map).length, "->", out);
