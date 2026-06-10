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
const sitemapPages = Array.from({ length: 23 }, (_, index) => `https://leica-camera.com/sitemap.xml?page=${index + 1}`);

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

function normalizeLeicaName(value = "") {
  return decodeHtml(value)
    .normalize("NFKD")
    .replace(/[–—]/g, "-")
    .replace(/\|.*$/g, " ")
    .replace(/\b(leica|camera|us|black|silver|safari|edition|finish|anodized|lacquered|chrome|metal|gray|matte|paint)\b/gi, " ")
    .replace(/\btyp\b/gi, "type")
    .replace(/\bf\//gi, "f")
    .replace(/\bf(\d+)\.(\d+)\b/gi, "f$1$2")
    .replace(/\b(\d+)mm\b/gi, "$1")
    .replace(/\basph\./gi, "asph")
    .replace(/[^a-z0-9.+-]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function titleAliases(entry) {
  const aliases = new Set([entry.model]);
  const model = entry.model;
  aliases.add(`Leica ${model}`);
  aliases.add(model.replace(/\bTyp\b/gi, "Type"));
  aliases.add(model.replace(/\bASPH\.$/i, "ASPH"));
  aliases.add(model.replace(/\b(\d+)mm\b/gi, "$1"));
  aliases.add(model.replace(/\bf\/(\d+)\.(\d+)\b/gi, "f$1$2"));
  return [...aliases].map(normalizeLeicaName);
}

function pageScore(url = "") {
  let score = 0;
  if (/\/black(?:-|$)/i.test(url) || /-black$/i.test(url)) score += 20;
  if (!/(silver|safari|100-years|edition|glossy|metal-gray|reporter)/i.test(url)) score += 10;
  if (/(technical-specification|downloads|discover)/i.test(url)) score -= 100;
  if (/(kit|set|bundle)/i.test(url)) score -= 60;
  return score;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Milford Photo used gear image catalog updater",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.text();
}

async function fetchLeicaPage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Milford Photo used gear image catalog updater",
      },
    });
    if (!response.ok) return null;
    const html = await response.text();
    const title = decodeHtml(
      html.match(/property="og:title"\s+content="([^"]+)"/i)?.[1] ||
        html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ||
        "",
    )
      .replace(/\s+/g, " ")
      .trim();
    const src = decodeHtml(html.match(/property="og:image"\s+content="([^"]+)"/i)?.[1] || "");
    if (!title || !src || /placeholder|logo|favicon/i.test(src)) return null;
    return {
      url,
      title,
      normalizedTitle: normalizeLeicaName(title),
      src,
    };
  } catch {
    return null;
  }
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
const leicaEntries = catalog
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
  .filter((entry) => entry.brand === "Leica");

const urls = new Set();
for (const sitemapUrl of sitemapPages) {
  const xml = await fetchText(sitemapUrl);
  for (const match of xml.matchAll(/https:\/\/leica-camera\.com\/en-US\/photography\/(?:cameras|lenses)\/[^"<]+/g)) {
    const url = decodeHtml(match[0]);
    if (/(technical-specification|downloads|discover|all-products)$/i.test(url)) continue;
    if (/(instant-cameras|sofort|accessories|overview|category)/i.test(url)) continue;
    urls.add(url);
  }
}

const pages = [];
const urlList = [...urls].sort((a, b) => pageScore(b) - pageScore(a));
for (let index = 0; index < urlList.length; index += 8) {
  const batch = await Promise.all(urlList.slice(index, index + 8).map(fetchLeicaPage));
  pages.push(...batch.filter(Boolean));
}

const byTitle = new Map();
for (const page of pages.sort((a, b) => pageScore(b.url) - pageScore(a.url))) {
  if (!byTitle.has(page.normalizedTitle)) {
    byTitle.set(page.normalizedTitle, page);
  }
}

const added = [];
const skipped = [];
for (const entry of leicaEntries) {
  if (imageMap[entry.key]) continue;
  const aliases = titleAliases(entry);
  const matches = aliases.map((alias) => byTitle.get(alias)).filter(Boolean);
  const uniqueMatches = [...new Map(matches.map((match) => [match.url, match])).values()].sort(
    (a, b) => pageScore(b.url) - pageScore(a.url),
  );
  if (uniqueMatches.length === 0) {
    skipped.push(entry.model);
    continue;
  }

  const match = uniqueMatches[0];
  imageMap[entry.key] = {
    src: match.src,
    alt: `Leica ${entry.model}`,
  };
  added.push(`${entry.model} -> ${match.title}`);
}

if (added.length > 0) {
  fs.writeFileSync(productImagesPath, renderProductImages(imageMap));
}

console.log(`Leica catalog entries: ${leicaEntries.length}`);
console.log(`Leica product URLs fetched: ${urlList.length}`);
console.log(`Parsed Leica pages: ${pages.length}`);
console.log(`Added mappings: ${added.length}`);
for (const item of added) console.log(`+ ${item}`);
if (skipped.length) {
  console.log("\nStill unmatched:");
  for (const item of skipped) console.log(`- ${item}`);
}
