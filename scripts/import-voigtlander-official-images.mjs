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
    model: "10.5mm f/0.95 Nokton (Micro Four Thirds)",
    src: "https://www.cosina.co.jp/wp/wp-content/uploads/2021/09/105_095_MFT_P00b.jpg",
  },
  {
    model: "17.5mm f/0.95 Nokton (Micro Four Thirds)",
    src: "https://www.cosina.co.jp/wp/wp-content/uploads/2021/09/175_095_MFT_P00b.jpg",
  },
  {
    model: "25mm f/0.95 Nokton Type II (Micro Four Thirds)",
    src: "https://www.cosina.co.jp/wp/wp-content/uploads/2021/09/250_095_MFT_P00b.jpg",
  },
  {
    model: "42.5mm f/0.95 Nokton (Micro Four Thirds)",
    src: "https://www.cosina.co.jp/wp/wp-content/uploads/2021/09/425_095_MFT_P00b.jpg",
  },
  {
    model: "15mm f/4.5 Super Wide Heliar III VM (Leica M)",
    src: "https://www.cosina.co.jp/wp/wp-content/uploads/2021/09/15_45_E_P00b.jpg",
  },
  {
    model: "21mm f/1.4 Nokton VM (Leica M)",
    src: "https://www.cosina.co.jp/wp/wp-content/uploads/2021/09/21_14_VM_P00b.jpg",
  },
  {
    model: "35mm f/1.4 Nokton Classic VM II (Leica M)",
    src: "https://www.cosina.co.jp/wp/wp-content/uploads/2021/09/35_14ii_VM_P00b.jpg",
  },
  {
    model: "50mm f/1.0 Nokton ASPH VM (Leica M)",
    src: "https://www.cosina.co.jp/wp/wp-content/uploads/2021/12/H-L1062711.jpg",
  },
  {
    model: "50mm f/1.2 Nokton ASPH VM (Leica M)",
    src: "https://www.cosina.co.jp/wp/wp-content/uploads/2021/09/50_12_E_P00b.jpg",
  },
  {
    model: "50mm f/2 APO-Lanthar (Sony E)",
    src: "https://www.cosina.co.jp/wp/wp-content/uploads/2021/09/E-50_2_P00b.jpg",
  },
  {
    model: "50mm f/2 APO-Lanthar (Nikon Z)",
    src: "https://www.cosina.co.jp/wp/wp-content/uploads/2022/04/Z-50_2-P00koltrdmk.jpg",
  },
  {
    model: "65mm f/2 Macro APO-Lanthar (Sony E)",
    src: "https://www.cosina.co.jp/wp/wp-content/uploads/2021/09/65_20_E_P00b.jpg",
  },
  {
    model: "75mm f/1.5 Nokton VM (Leica M)",
    src: "https://www.cosina.co.jp/wp/wp-content/uploads/2021/09/75_15_VM_P00b.jpg",
  },
  {
    model: "90mm f/2.8 APO-Skopar VM (Leica M)",
    src: "https://www.cosina.co.jp/wp/wp-content/uploads/2021/10/VM90_28-P00b.jpg",
  },
  {
    model: "110mm f/2.5 Macro APO-Lanthar (Sony E)",
    src: "https://www.cosina.co.jp/wp/wp-content/uploads/2021/09/110_25_E_P00b.jpg",
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
  if (entry.brand !== "Voigtlander") continue;
  const match = verifiedByModel.get(normalizeProductImageText(entry.model));
  if (!match) continue;
  if (imageMap[entry.key]) {
    skippedExisting.push(entry);
    continue;
  }
  imageMap[entry.key] = {
    src: match.src,
    alt: `Voigtlander ${entry.model}`,
  };
  added.push(entry);
}

fs.writeFileSync(productImagesPath, renderProductImages(imageMap));

console.log(`Verified Voigtlander product images: ${verifiedByModel.size}`);
console.log(`Existing Voigtlander entries already mapped: ${skippedExisting.length}`);
console.log(`New official Voigtlander mappings added: ${added.length}`);
if (added.length) {
  console.log("\nAdded official Voigtlander mappings:");
  for (const entry of added) console.log(`- ${entry.category} | ${entry.model}`);
}
