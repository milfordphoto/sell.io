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
    model: "AT-X 11-16mm f/2.8 Pro DX II",
    src: "https://cdn.shopify.com/s/files/1/0606/1306/7006/products/atx-1116-01.jpg?v=1635874806",
  },
  {
    model: "AT-X 12-28mm f/4 Pro DX",
    src: "https://cdn.shopify.com/s/files/1/0606/1306/7006/products/atx-1228-01.jpg?v=1635874142",
  },
  {
    model: "opera 16-28mm f/2.8 FF",
    src: "https://cdn.shopify.com/s/files/1/0606/1306/7006/products/OPR-AF168FXC---opera16_28_Canon_web.jpg?v=1635459509",
  },
  {
    model: "opera 50mm f/1.4 FF",
    src: "https://cdn.shopify.com/s/files/1/0606/1306/7006/products/Tokina_50mmF1.4_S.jpg?v=1635455356",
  },
  {
    model: "atx-m 23mm f/1.4 (Sony E)",
    src: "https://cdn.shopify.com/s/files/1/0606/1306/7006/products/atxm-23mm-sony-product-01.jpg?v=1635455598",
  },
  {
    model: "atx-m 33mm f/1.4 (Sony E)",
    src: "https://cdn.shopify.com/s/files/1/0606/1306/7006/products/atxm-33mm-sonymount-product-01.jpg?v=1635455577",
  },
  {
    model: "atx-m 56mm f/1.4 (Sony E)",
    src: "https://cdn.shopify.com/s/files/1/0606/1306/7006/products/atxm-56mm-sonymount-product-01.jpg?v=1635455518",
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

const verifiedByModel = new Map();
for (const product of verifiedProducts) {
  if (await verifyImage(product.src)) verifiedByModel.set(normalizeProductImageText(product.model), product);
}

const added = [];
const skippedExisting = [];

for (const entry of catalogEntries) {
  if (entry.brand !== "Tokina") continue;
  const match = verifiedByModel.get(normalizeProductImageText(entry.model));
  if (!match) continue;
  if (imageMap[entry.key]) {
    skippedExisting.push(entry);
    continue;
  }
  imageMap[entry.key] = {
    src: match.src,
    alt: `Tokina ${entry.model}`,
  };
  added.push(entry);
}

fs.writeFileSync(productImagesPath, renderProductImages(imageMap));

console.log(`Verified Tokina product images: ${verifiedByModel.size}`);
console.log(`Existing Tokina entries already mapped: ${skippedExisting.length}`);
console.log(`New official Tokina mappings added: ${added.length}`);
if (added.length) {
  console.log("\nAdded official Tokina mappings:");
  for (const entry of added) console.log(`- ${entry.category} | ${entry.model}`);
}
