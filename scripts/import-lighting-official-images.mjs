import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogFiles = [
  "catalog-canon.js",
  "catalog-nikon.js",
  "catalog-sony-fuji-oly.js",
  "catalog-panasonic-pentax-third-party.js",
  "catalog-leica-hasselblad.js",
  "catalog-modern-supplement.js",
  "catalog.js",
];
const productImagesPath = path.join(root, "product-images.js");

const verifiedProducts = [
  {
    brand: "Westcott",
    model: "FJ80 II Speedlight",
    src: "https://cdn.shopify.com/s/files/1/0647/2502/4999/files/4790N-Front-Angle_12e2cc2b-eaef-496f-b148-81d0f4946e89.jpg?v=1738344834",
  },
  {
    brand: "Westcott",
    model: "FJ400 II Strobe",
    src: "https://cdn.shopify.com/s/files/1/0647/2502/4999/files/5700-Angle-Left_38956c70-9c66-476a-89eb-3ef55b26aa5c.jpg?v=1768332158",
  },
  {
    brand: "Westcott",
    model: "FJ-X3 Trigger",
    src: "https://cdn.shopify.com/s/files/1/0647/2502/4999/files/4785-Group-Colors.jpg?v=1771020969",
  },
  {
    brand: "Nissin",
    model: "MG10",
    src: "https://cdn.shopify.com/s/files/1/0249/3048/4298/products/MG10_back_shutter_180-transparency.png?v=1676054502",
  },
  {
    brand: "Nissin",
    model: "Air 10s Commander",
    src: "https://cdn.shopify.com/s/files/1/0249/3048/4298/products/Air10_FR_Sony_NEW_L_1500x_57242a1d-89d9-41a2-8393-8a23c6c52471.jpg?v=1576632530",
  },
];

function loadCatalog() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(
    `${catalogFiles.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n")}
globalThis.GEAR_CATALOG_EXPORT = GEAR_CATALOG;`,
    context,
    { filename: "catalog-bundle.js" },
  );
  return context.GEAR_CATALOG_EXPORT;
}

function loadImageMap() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(productImagesPath, "utf8"), context, {
    filename: "product-images.js",
  });
  return context.window.MP_PRODUCT_IMAGE_OVERRIDES || {};
}

function normalizeProductImageText(value = "") {
  return String(value).replace(/[–—]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeProductImageCategory(category = "") {
  const text = normalizeProductImageText(category);
  if (text.includes("lens")) return "lens";
  if (text.includes("film")) return "film camera";
  if (text.includes("camera") || text.includes("body")) return "digital camera";
  return text;
}

function productImageKey(brand = "", category = "", model = "") {
  return [
    normalizeProductImageText(brand),
    normalizeProductImageCategory(category),
    normalizeProductImageText(model),
  ].join("|");
}

async function verifyImage(url) {
  const response = await fetch(url, {
    method: "HEAD",
    headers: {
      "User-Agent": "Milford Photo used gear image catalog updater",
    },
  });
  return response.ok && (response.headers.get("content-type") || "").startsWith("image/");
}

function renderProductImages(imageMap) {
  const sortedEntries = Object.entries(imageMap).sort(([a], [b]) => a.localeCompare(b));
  const lines = [
    `// Auto-generated from Milford/Dakis exports and conservative manufacturer matches on ${new Date().toISOString().slice(0, 10)}.`,
    "// Conservative matches only: existing quote catalog key -> product image URL.",
    "(function () {",
    "  window.MP_PRODUCT_IMAGE_OVERRIDES = Object.freeze({",
  ];

  for (const [key, image] of sortedEntries) {
    lines.push(`    ${JSON.stringify(key)}: {`);
    lines.push(`      src: ${JSON.stringify(image.src)},`);
    lines.push(`      alt: ${JSON.stringify(image.alt)},`);
    lines.push("    },");
  }

  lines.push("  });");
  lines.push("})();");
  lines.push("");
  return lines.join("\n");
}

const catalog = loadCatalog();
const imageMap = { ...loadImageMap() };
const catalogEntries = catalog.flatMap((brand) =>
  brand.categories.flatMap((category) =>
    category.items.map((item) => ({
      brand: brand.brand,
      category: category.name,
      model: item.name,
      key: productImageKey(brand.brand, category.name, item.name),
    })),
  ),
);

const verifiedByKey = new Map();
for (const product of verifiedProducts) {
  if (!await verifyImage(product.src)) continue;
  verifiedByKey.set(`${normalizeProductImageText(product.brand)}|${normalizeProductImageText(product.model)}`, product);
}

const added = [];
const skippedExisting = [];

for (const entry of catalogEntries) {
  const match = verifiedByKey.get(`${normalizeProductImageText(entry.brand)}|${normalizeProductImageText(entry.model)}`);
  if (!match) continue;
  if (imageMap[entry.key]) {
    skippedExisting.push(entry);
    continue;
  }
  imageMap[entry.key] = {
    src: match.src,
    alt: `${entry.brand} ${entry.model}`,
  };
  added.push(entry);
}

fs.writeFileSync(productImagesPath, renderProductImages(imageMap));

console.log(`Verified lighting product images: ${verifiedByKey.size}`);
console.log(`Existing lighting entries already mapped: ${skippedExisting.length}`);
console.log(`New official lighting mappings added: ${added.length}`);
if (added.length) {
  console.log("\nAdded official lighting mappings:");
  for (const entry of added) console.log(`- ${entry.brand} | ${entry.category} | ${entry.model}`);
}
