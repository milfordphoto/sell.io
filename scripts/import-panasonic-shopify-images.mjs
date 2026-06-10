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

function normalizeMatchText(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[–—]/g, "-")
    .replace(/\bf\//gi, "f")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function canonicalPanasonicText(value = "") {
  return normalizeMatchText(value)
    .replace(/\bs5\s*iix\b/g, "s5m2x")
    .replace(/\bs5iix\b/g, "s5m2x")
    .replace(/\bs5\s*ii\b/g, "s5m2")
    .replace(/\bs5ii\b/g, "s5m2")
    .replace(/\bs1r\s*ii\b/g, "s1rm2")
    .replace(/\bs1rii\b/g, "s1rm2")
    .replace(/\bs1\s*iie\b/g, "s1m2e")
    .replace(/\bs1iie\b/g, "s1m2e")
    .replace(/\bs1\s*ii\b/g, "s1m2")
    .replace(/\bs1ii\b/g, "s1m2")
    .replace(/\bgh5\s*ii\b/g, "gh5m2")
    .replace(/\bgh5ii\b/g, "gh5m2")
    .replace(/\bg9\s*ii\b/g, "g9m2")
    .replace(/\bg9ii\b/g, "g9m2");
}

const panasonicCameraCodes = [
  "s5m2x",
  "s1m2e",
  "s1rm2",
  "gh5m2",
  "s1m2",
  "g9m2",
  "gh5s",
  "g100",
  "g97",
  "g95",
  "g85",
  "gx85",
  "gh6",
  "gh5",
  "gh4",
  "gh3",
  "gh2",
  "gh1",
  "gx9",
  "gx8",
  "gx7",
  "gx1",
  "gf5",
  "gf2",
  "gf1",
  "gm1",
  "s1h",
  "s1r",
  "s5",
  "s1",
  "s9",
  "g7",
  "g6",
  "g5",
  "g3",
  "g2",
  "g1",
].sort((a, b) => b.length - a.length);

function cameraCodes(value = "") {
  const tokens = canonicalPanasonicText(value).split(" ");
  return panasonicCameraCodes.filter((code) => tokens.includes(code));
}

function lensSignature(value = "") {
  const text = normalizeMatchText(value).replace(/\bf(\d)/g, " f$1");
  return {
    focal: (text.match(/\b\d+(?:-\d+)?mm\b/) || [])[0],
    aperture: (text.match(/\bf\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?\b/) || [])[0],
  };
}

function lensTokens(value = "") {
  return normalizeMatchText(value)
    .split(" ")
    .filter(Boolean)
    .filter(
      (token) =>
        ![
          "lumix",
          "panasonic",
          "leica",
          "series",
          "camera",
          "lens",
          "l",
          "mount",
          "asph",
          "vario",
          "g",
          "s",
          "pro",
          "micro",
          "four",
          "thirds",
        ].includes(token),
    );
}

function productImage(product) {
  return product.images?.[0]?.src || product.image?.src || "";
}

function isExcludedPanasonicProduct(title = "", kind = "") {
  const shared = /\b(rental kit|battery|strap|cap|software|teleconverter|camcorder|shaver|phone|microphone|adaptor|adapter|grip|coupler|charger|eyecup|remote)\b/i;
  if (shared.test(title)) return true;
  if (kind === "camera") return /\+|\b(with|kit|lens|compact|point|fz|zs|box)\b/i.test(title);
  if (kind === "lens") return /\+|\bwith\b|\bkit\b/i.test(title);
  return false;
}

async function fetchPanasonicProducts() {
  const products = [];
  for (let page = 1; page <= 8; page += 1) {
    const response = await fetch(`https://shop.panasonic.com/products.json?limit=250&page=${page}`, {
      headers: {
        "User-Agent": "Milford Photo used gear image catalog updater",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching Panasonic products page ${page}`);
    const data = await response.json();
    if (!data.products?.length) break;
    products.push(...data.products);
  }
  return products.filter((product) => /lumix/i.test(`${product.title} ${product.handle}`) && productImage(product));
}

function selectPanasonicMatch(entry, products) {
  const isLens = normalizeProductImageCategory(entry.category) === "lens";
  if (isLens) {
    const signature = lensSignature(entry.model);
    if (!signature.focal || !signature.aperture) return null;
    const entryTokens = lensTokens(entry.model);
    const candidates = products.filter((product) => {
      if (isExcludedPanasonicProduct(product.title, "lens")) return false;
      const productSignature = lensSignature(product.title);
      if (productSignature.focal !== signature.focal || productSignature.aperture !== signature.aperture) return false;
      const compactTitle = normalizeMatchText(`${product.title} ${product.handle}`).replace(/\s+/g, "");
      const productTokenSet = new Set(lensTokens(product.title));
      return entryTokens.every(
        (token) => productTokenSet.has(token) || compactTitle.includes(token.replace(/\s+/g, "")),
      );
    });
    return candidates.sort((a, b) => a.title.length - b.title.length)[0] || null;
  }

  const entryCodes = cameraCodes(entry.model);
  if (!entryCodes.length) return null;
  const candidates = products.filter((product) => {
    if (isExcludedPanasonicProduct(product.title, "camera")) return false;
    const productCodes = cameraCodes(`${product.title} ${product.handle}`);
    return entryCodes.every((code) => productCodes.includes(code));
  });

  return candidates.sort((a, b) => {
    const aBody = /\bbody\b/i.test(a.title) ? 1 : 0;
    const bBody = /\bbody\b/i.test(b.title) ? 1 : 0;
    const aKit = /\+|\bwith\b|\bkit\b/i.test(a.title) ? 1 : 0;
    const bKit = /\+|\bwith\b|\bkit\b/i.test(b.title) ? 1 : 0;
    return bBody - aBody || aKit - bKit || a.title.length - b.title.length;
  })[0] || null;
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
const panasonicProducts = await fetchPanasonicProducts();
const added = [];
const skippedExisting = [];
const skippedUnverified = [];

for (const entry of catalogEntries) {
  if (entry.brand !== "Panasonic") continue;
  if (imageMap[entry.key]) {
    skippedExisting.push(entry);
    continue;
  }
  const match = selectPanasonicMatch(entry, panasonicProducts);
  if (!match) continue;
  const src = productImage(match);
  if (!(await verifyImage(src))) {
    skippedUnverified.push({ entry, match });
    continue;
  }
  imageMap[entry.key] = {
    src,
    alt: `Panasonic ${entry.model}`,
  };
  added.push({ entry, match });
}

fs.writeFileSync(productImagesPath, renderProductImages(imageMap));

console.log(`Panasonic Shopify products parsed: ${panasonicProducts.length}`);
console.log(`Existing Panasonic entries already mapped: ${skippedExisting.length}`);
console.log(`New Panasonic Shopify mappings added: ${added.length}`);
if (added.length) {
  console.log("\nAdded Panasonic mappings:");
  for (const { entry, match } of added) {
    console.log(`- ${entry.category} | ${entry.model} -> ${match.title}`);
  }
}
if (skippedUnverified.length) {
  console.log("\nSkipped unverified Panasonic image URLs:");
  for (const { entry, match } of skippedUnverified) {
    console.log(`- ${entry.category} | ${entry.model} -> ${match.title}`);
  }
}
