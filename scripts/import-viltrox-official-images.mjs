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
    model: "AF 13mm f/1.4",
    src: "https://cdn.shopify.com/s/files/1/0104/0380/7298/files/AF_13mm_F1.4_XF-134471.png?v=1722921085",
  },
  {
    model: "AF 16mm f/1.8",
    src: "https://cdn.shopify.com/s/files/1/0104/0380/7298/files/AF16mm_F1.8_FE-444322.png?v=1770356834",
  },
  {
    model: "AF 20mm f/2.8",
    src: "https://cdn.shopify.com/s/files/1/0104/0380/7298/files/AF20mm_F2.8_FE-540811.png?v=1736821928",
  },
  {
    model: "AF 23mm f/1.4",
    src: "https://cdn.shopify.com/s/files/1/0104/0380/7298/files/AF23mm_F1.4XF-866271.png?v=1722921085",
  },
  {
    model: "AF 27mm f/1.2 Pro",
    src: "https://cdn.shopify.com/s/files/1/0104/0380/7298/files/AF_27mm_F1.2_Pro_XF.png?v=1756478163",
  },
  {
    model: "AF 33mm f/1.4",
    src: "https://cdn.shopify.com/s/files/1/0104/0380/7298/files/AF33mm_F1.4_XF-589642.png?v=1722921084",
  },
  {
    model: "AF 40mm f/2.5",
    src: "https://cdn.shopify.com/s/files/1/0104/0380/7298/files/40mm_F2.5_E__-front_view-176970.png?v=1764830971",
  },
  {
    model: "AF 50mm f/2 Air",
    src: "https://cdn.shopify.com/s/files/1/0104/0380/7298/files/AF50mmF2.0AirFE-14.png?v=1743642539",
  },
  {
    model: "AF 56mm f/1.4",
    src: "https://cdn.shopify.com/s/files/1/0104/0380/7298/files/AF56mm_F1.4_XF-789704.png?v=1722921088",
  },
  {
    model: "AF 75mm f/1.2 Pro",
    src: "https://cdn.shopify.com/s/files/1/0104/0380/7298/files/AF_75mm_F1.2_Pro_XF_13762c0e-3a85-406c-acb1-5f0ce5c78ee9.png?v=1756478182",
  },
  {
    model: "AF 85mm f/1.8 II",
    src: "https://cdn.shopify.com/s/files/1/0104/0380/7298/files/AF85mm_F1.8_II_FE-762051.png?v=1722921089",
  },
  {
    model: "AF 135mm f/1.8 LAB",
    src: "https://cdn.shopify.com/s/files/1/0104/0380/7298/files/AF135mm_F1.8_LAB_FE-_front_view-426409.png?v=1730796483",
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

function normalizeModel(value = "") {
  return normalizeProductImageText(value)
    .replace(/\bf\/\s*/g, "f")
    .replace(/\bf(?=\d)/g, "f/")
    .replace(/\bf\/(\d+)\.0\b/g, "f/$1")
    .replace(/\s+/g, " ")
    .trim();
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
  if (await verifyImage(product.src)) verifiedByModel.set(normalizeModel(product.model), product);
}

const added = [];
const skippedExisting = [];

for (const entry of catalogEntries) {
  if (entry.brand !== "Viltrox") continue;
  const match = verifiedByModel.get(normalizeModel(entry.model));
  if (!match) continue;
  if (imageMap[entry.key]) {
    skippedExisting.push(entry);
    continue;
  }
  imageMap[entry.key] = {
    src: match.src,
    alt: `Viltrox ${entry.model}`,
  };
  added.push(entry);
}

fs.writeFileSync(productImagesPath, renderProductImages(imageMap));

console.log(`Verified Viltrox product images: ${verifiedByModel.size}`);
console.log(`Existing Viltrox entries already mapped: ${skippedExisting.length}`);
console.log(`New official Viltrox mappings added: ${added.length}`);
if (added.length) {
  console.log("\nAdded official Viltrox mappings:");
  for (const entry of added) console.log(`- ${entry.category} | ${entry.model}`);
}
