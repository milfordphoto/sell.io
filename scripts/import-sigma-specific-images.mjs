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

const specificSigmaMatches = [
  ["Art 60-600mm f/4.5-6.3 DG OS HSM", "https://www.sigma-global.com/en/lenses/s018_60_600_45_63/"],
  ["Art 70-200mm f/2.8 DG OS HSM", "https://www.sigma-global.com/en/lenses/s018_70_200_28/"],
  ["Art 70-200mm f/2.8 DG DN OS", "https://www.sigma-global.com/en/lenses/s023_70_200_28/"],
  ["Art 150-600mm f/5-6.3 DG OS HSM", "https://www.sigma-global.com/en/lenses/s014_150_600_5_63/"],
  ["Art 500mm f/4 DG OS HSM", "https://www.sigma-global.com/en/lenses/s016_500_4/"],
  ["Contemporary 28-45mm f/1.8 DG DN", "https://www.sigma-global.com/en/lenses/a024_28_45_18/"],
  ["Contemporary 65mm f/2 DG DN", "https://www.sigma-global.com/en/lenses/c020_65_2/"],
  ["Sports 14-24mm f/2.8 DG HSM", "https://www.sigma-global.com/en/lenses/a018_14_24_28/"],
  ["Sports 14-24mm f/2.8 DG DN", "https://www.sigma-global.com/en/lenses/a019_14_24_28/"],
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

function decodeHtml(value = "") {
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchSigmaProduct(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Milford Photo used gear image catalog updater",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  const html = await response.text();
  const title = decodeHtml(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const image = decodeHtml(html.match(/<img[^>]+src="([^"]*product_img01[^"]*)"[^>]*>/i)?.[1] || "");
  if (!title || !image) {
    throw new Error(`Missing title/image for ${url}`);
  }
  return {
    title,
    src: new URL(image, "https://www.sigma-global.com").href,
  };
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
const sigmaEntriesByModel = new Map(
  catalog
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
    .filter((entry) => entry.brand === "Sigma")
    .map((entry) => [entry.model, entry]),
);

const added = [];
const skipped = [];
for (const [model, url] of specificSigmaMatches) {
  const entry = sigmaEntriesByModel.get(model);
  if (!entry) {
    skipped.push(`${model}: not in catalog`);
    continue;
  }
  if (imageMap[entry.key]) {
    skipped.push(`${model}: already mapped`);
    continue;
  }
  const product = await fetchSigmaProduct(url);
  imageMap[entry.key] = {
    src: product.src,
    alt: `Sigma ${entry.model}`,
  };
  added.push(`${model} -> ${product.title}`);
}

if (added.length > 0) {
  fs.writeFileSync(productImagesPath, renderProductImages(imageMap));
}

console.log(`Added mappings: ${added.length}`);
for (const item of added) console.log(`+ ${item}`);
if (skipped.length) {
  console.log("\nSkipped:");
  for (const item of skipped) console.log(`- ${item}`);
}
