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
    model: "AF 14mm f/2.8 FE (Sony E)",
    src: "https://cdn.shopify.com/s/files/1/0585/6129/8601/products/14mm-f28-af-full-frame-ultra-wide-angle-sony-e-276175.png?v=1647618386",
  },
  {
    model: "AF 18mm f/2.8 FE (Sony E)",
    src: "https://cdn.shopify.com/s/files/1/0585/6129/8601/products/18mm-f28-af-compact-full-frame-super-wide-angle-sony-e-679417.jpg?v=1647618372",
  },
  {
    model: "AF 24mm f/1.8 FE (Sony E)",
    src: "https://cdn.shopify.com/s/files/1/0585/6129/8601/products/24mm-f18-af-compact-full-frame-wide-angle-sony-e-744164.png?v=1647618387",
  },
  {
    model: "AF 35mm f/1.8 FE (Sony E)",
    src: "https://cdn.shopify.com/s/files/1/0585/6129/8601/products/35mm-f18-af-compact-full-frame-wide-angle-sony-e-882527.jpg?v=1647618366",
  },
  {
    model: "AF 45mm f/1.8 FE (Sony E)",
    src: "https://cdn.shopify.com/s/files/1/0585/6129/8601/products/45mm-f18-af-compact-full-frame-sony-e-884425.jpg?v=1647618448",
  },
  {
    model: "AF 50mm f/1.4 FE II (Sony E)",
    src: "https://cdn.shopify.com/s/files/1/0585/6129/8601/products/50mm-f14-af-series-ii-full-frame-sony-e-636197.png?v=1647618422",
  },
  {
    model: "AF 75mm f/1.8 FE (Sony E)",
    src: "https://cdn.shopify.com/s/files/1/0585/6129/8601/products/75mm-f18-af-compact-full-frame-telephoto-sony-e-963596.jpg?v=1647618439",
  },
  {
    model: "AF 85mm f/1.4 FE II (Sony E)",
    src: "https://cdn.shopify.com/s/files/1/0585/6129/8601/products/85mm-f14-af-series-ii-full-frame-telephoto-sony-e-io85se2-e-334501.jpg?v=1659014541",
  },
  {
    model: "AF 135mm f/1.8 FE (Sony E)",
    src: "https://cdn.shopify.com/s/files/1/0585/6129/8601/products/135mm-f18-af-full-frame-telephoto-sony-e-463916.jpg?v=1647618284",
  },
  {
    model: "12mm f/2 NCS CS (APS-C)",
    src: "https://cdn.shopify.com/s/files/1/0585/6129/8601/products/12mm-f20-high-speed-wide-angle-777689.jpg?v=1647618285",
  },
  {
    model: "14mm f/2.8 ED AS IF UMC (DSLR/Mirrorless)",
    src: "https://cdn.shopify.com/s/files/1/0585/6129/8601/products/14mm-f28-full-frame-ultra-wide-angle-322340.jpg?v=1647618378",
  },
  {
    model: "135mm f/2 ED UMC (DSLR/Mirrorless)",
    src: "https://cdn.shopify.com/s/files/1/0585/6129/8601/products/135mm-f20-full-frame-telephoto-399601.jpg?v=1647618281",
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
  if (entry.brand !== "Rokinon / Samyang") continue;
  const match = verifiedByModel.get(normalizeProductImageText(entry.model));
  if (!match) continue;
  if (imageMap[entry.key]) {
    skippedExisting.push(entry);
    continue;
  }
  imageMap[entry.key] = {
    src: match.src,
    alt: `Rokinon / Samyang ${entry.model}`,
  };
  added.push(entry);
}

fs.writeFileSync(productImagesPath, renderProductImages(imageMap));

console.log(`Verified Rokinon / Samyang product images: ${verifiedByModel.size}`);
console.log(`Existing Rokinon / Samyang entries already mapped: ${skippedExisting.length}`);
console.log(`New official Rokinon / Samyang mappings added: ${added.length}`);
if (added.length) {
  console.log("\nAdded official Rokinon / Samyang mappings:");
  for (const entry of added) console.log(`- ${entry.category} | ${entry.model}`);
}
