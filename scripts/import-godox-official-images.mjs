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
    model: "V1 Round Head Flash",
    src: "https://www.godox.com/static/upload/image/20220330/1648607424803941.jpg",
  },
  {
    model: "V860III Flash",
    src: "https://www.godox.com/static/upload/image/20230807/1691391760155720.jpg",
  },
  {
    model: "TT685 Flash",
    src: "https://www.godox.com/static/upload/image/20251115/1763178127138698.jpg",
  },
  {
    model: "TT600 Flash",
    src: "https://www.godox.com/static/upload/image/20251115/1763177999202961.jpg",
  },
  {
    model: "AD200Pro Pocket Flash",
    src: "https://www.godox.com/static/upload/image/20220330/1648603335165744.jpg",
  },
  {
    model: "AD400Pro Flash",
    src: "https://www.godox.com/static/upload/image/20230807/1691388324206646.jpg",
  },
  {
    model: "AD600Pro Flash",
    src: "https://www.godox.com/static/upload/image/20220330/1648605103678905.jpg",
  },
  {
    model: "AD300Pro Flash",
    src: "https://www.godox.com/static/upload/image/20220330/1648604534772334.jpg",
  },
  {
    model: "ML60 LED Light",
    src: "https://www.godox.com/static/upload/image/20220328/1648433972193571.jpg",
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
  if (entry.brand !== "Godox") continue;
  const match = verifiedByModel.get(normalizeProductImageText(entry.model));
  if (!match) continue;
  if (imageMap[entry.key]) {
    skippedExisting.push(entry);
    continue;
  }
  imageMap[entry.key] = {
    src: match.src,
    alt: `Godox ${entry.model}`,
  };
  added.push(entry);
}

fs.writeFileSync(productImagesPath, renderProductImages(imageMap));

console.log(`Verified Godox product images: ${verifiedByModel.size}`);
console.log(`Existing Godox entries already mapped: ${skippedExisting.length}`);
console.log(`New official Godox mappings added: ${added.length}`);
if (added.length) {
  console.log("\nAdded official Godox mappings:");
  for (const entry of added) console.log(`- ${entry.category} | ${entry.model}`);
}
