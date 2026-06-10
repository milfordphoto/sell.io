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

const officialMatches = [
  {
    model: "X1D II 50C",
    src: "https://cdn.hasselblad.com/f/77891/2560x1775/8e88ad7c9e/78edd304935de45296437c9924c31fac68cf6653_x1d-ii-top-dark.jpg",
  },
  {
    model: "907X 50C",
    src: "https://cdn.hasselblad.com/f/77891/3000x2250/2bdf347cb4/907x-xcd38v-leaf.jpg",
  },
  {
    model: "907X & CFV 100C",
    src: "https://cdn.hasselblad.com/f/77891/2400x1200/570cf67249/100mp_product_pc.jpg",
  },
  {
    model: "X2D 100C",
    src: "https://cdn.hasselblad.com/f/77891/1280x640/e233711803/buy-now.png",
  },
  {
    model: "H6D-100c",
    src: "https://cdn.hasselblad.com/f/77891/2048x1075/2f39dbdf34/h6d_front_darkgrey.jpg",
  },
  {
    model: "XCD 21mm f/4",
    src: "https://cdn.hasselblad.com/f/77891/1000x1000/cbbcbf48da/xcd_21_main_1000px.jpg",
  },
  {
    model: "XCD 28mm f/4 P",
    src: "https://cdn.hasselblad.com/f/77891/1000x1000/0c9083fb44/28p-listing.jpg",
  },
  {
    model: "XCD 30mm f/3.5",
    src: "https://cdn.hasselblad.com/f/77891/1000x1000/f24df2e7b6/xcd_30_main_1000px.jpg",
  },
  {
    model: "XCD 45mm f/3.5",
    src: "https://cdn.hasselblad.com/f/77891/1000x1000/405a743f36/xcd_45_main_1000px.jpg",
  },
  {
    model: "XCD 45mm f/4 P",
    src: "https://cdn.hasselblad.com/f/77891/1000x1000/812d08cba0/xcd_45p_main_1000px.jpg",
  },
  {
    model: "XCD 65mm f/2.8",
    src: "https://cdn.hasselblad.com/f/77891/1000x1000/758f020688/xcd_65_main_1000px.jpg",
  },
  {
    model: "XCD 80mm f/1.9",
    src: "https://cdn.hasselblad.com/f/77891/1000x1000/8028e5a709/xcd_80_main_1000px.jpg",
  },
  {
    model: "XCD 90mm f/3.2",
    src: "https://cdn.hasselblad.com/f/77891/1000x1000/b16940333f/xcd_90_main_1000px.jpg",
  },
  {
    model: "XCD 120mm f/3.5 Macro",
    src: "https://cdn.hasselblad.com/f/77891/1000x1000/c91dd73a74/xcd_120_macro_main_1000px.jpg",
  },
  {
    model: "XCD 135mm f/2.8",
    src: "https://cdn.hasselblad.com/f/77891/1000x1000/be510112d1/xcd_135_main_1000px.jpg",
  },
  {
    model: "XCD 20-35mm f/3.2-4.5 E",
    src: "https://cdn.hasselblad.com/f/77891/1000x1000/33968ad3ee/xcd-2035e-listing.jpg",
  },
  {
    model: "XCD 35-75mm f/3.5-4.5",
    src: "https://cdn.hasselblad.com/f/77891/1000x1000/95a83fac54/xcd_3575_main_1000px.jpg",
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
const hasselbladEntries = catalog
  .flatMap((brand) =>
    brand.categories.flatMap((category) =>
      category.items.map((item) => ({
        brand: brand.brand,
        category: category.name,
        model: item.name,
        key: productImageKey(brand.brand, category.name, item.name),
      })),
    ),
  )
  .filter((entry) => entry.brand === "Hasselblad");

const byModel = new Map(hasselbladEntries.map((entry) => [entry.model, entry]));
const added = [];
const skipped = [];

for (const match of officialMatches) {
  const entry = byModel.get(match.model);
  if (!entry) {
    skipped.push(`${match.model} (not in catalog)`);
    continue;
  }
  if (imageMap[entry.key]) continue;
  imageMap[entry.key] = {
    src: match.src,
    alt: `Hasselblad ${entry.model}`,
  };
  added.push(entry.model);
}

if (added.length > 0) {
  fs.writeFileSync(productImagesPath, renderProductImages(imageMap));
}

console.log(`Hasselblad catalog entries: ${hasselbladEntries.length}`);
console.log(`Added mappings: ${added.length}`);
for (const item of added) console.log(`+ ${item}`);
if (skipped.length) {
  console.log("\nSkipped:");
  for (const item of skipped) console.log(`- ${item}`);
}
