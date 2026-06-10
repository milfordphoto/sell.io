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
const supportBaseUrl = "https://learnandsupport.getolympus.com";
const legacyIndexUrl = `${supportBaseUrl}/support/legacy/all`;

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

function normalizeSupportName(value = "") {
  return decodeHtml(value)
    .normalize("NFKD")
    .replace(/<[^>]+>/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/\((?:om system|black|silver|white)\)/gi, " ")
    .replace(/\bf\//gi, "f")
    .replace(/\bf(\d+)\.0\b/gi, "f$1")
    .replace(/\bf(\d+)\.0-/gi, "f$1-")
    .replace(/\b(olympus|om system|om-system|om-d|evolt|digital|ed|body|camera|lens|lenses|only|black|silver|white)\b/gi, " ")
    .replace(/[^a-z0-9.+-]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function slugify(value = "") {
  return decodeHtml(value)
    .normalize("NFKD")
    .replace(/\((?:om system|black|silver|white)\)/gi, " ")
    .replace(/\bf\//gi, "f")
    .replace(/\bf(\d+)\.0\b/gi, "f$1")
    .replace(/\bf(\d+)\.0-/gi, "f$1-")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function lensBaseSlug(model = "") {
  return slugify(model)
    .replace(/^m-zuiko-/, "")
    .replace(/^digital-/, "")
    .replace(/^ed-/, "");
}

function supportSlugCandidates(entry) {
  const model = entry.model;
  const modelSlug = slugify(model);
  const category = normalizeProductImageCategory(entry.category);
  const candidates = new Set([modelSlug]);

  if (category === "digital camera") {
    const noPen = model.replace(/^PEN\s+/i, "");
    const noPenSlug = slugify(noPen);
    candidates.add(noPenSlug);
    candidates.add(`om-d-${modelSlug}`);
    candidates.add(`om-d-${noPenSlug}`);
    candidates.add(`evolt-${modelSlug}`);
    candidates.add(`evolt-${noPenSlug}`);
  }

  if (category === "lens") {
    const base = lensBaseSlug(model);
    candidates.add(`m-zuiko-${base}`);
    candidates.add(`m-zuiko-digital-${base}`);
    candidates.add(`m-zuiko-digital-ed-${base}`);
    candidates.add(`m-zuiko-ed-${base}`);
  }

  return [...candidates].filter(Boolean);
}

function titleAliases(entry) {
  const aliases = new Set([entry.model]);
  const model = entry.model;
  const category = normalizeProductImageCategory(entry.category);

  if (category === "digital camera") {
    aliases.add(`OM-D ${model}`);
    aliases.add(`EVOLT ${model}`);
    if (!/^PEN\b/i.test(model) && /^E-P/i.test(model)) {
      aliases.add(`PEN ${model}`);
    }
  }

  if (category === "lens") {
    const noPrefix = model.replace(/^M\.?Zuiko\s*/i, "");
    aliases.add(`M.Zuiko Digital ${noPrefix}`);
    aliases.add(`M.Zuiko Digital ED ${noPrefix}`);
    aliases.add(`M.Zuiko ED ${noPrefix}`);
    aliases.add(`M.Zuiko Digital ${noPrefix.replace(/\bfisheye\b/gi, " ")}`);
    aliases.add(`M.Zuiko Digital ED ${noPrefix.replace(/\bfisheye\b/gi, " ")}`);
  }

  return [...aliases].map(normalizeSupportName);
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

async function fetchSupportPage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Milford Photo used gear image catalog updater",
      },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const title = decodeHtml(
      html.match(/<h1\b(?=[^>]*\bclass="[^"]*\bproduct-header__title\b[^"]*")[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "",
    )
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const imageSrc = html.match(/product-header__img[\s\S]*?<img\b[^>]*src="([^"]+)"/i)?.[1] || "";
    if (!title || !imageSrc || /no[-_]image/i.test(imageSrc)) return null;
    return {
      title,
      src: new URL(decodeHtml(imageSrc), url).href,
      url,
    };
  } catch (error) {
    return { error: error.message, url };
  }
}

function parseLegacyLinks(html) {
  const links = [];
  const anchorPattern = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorPattern.exec(html))) {
    const href = decodeHtml(match[1]);
    const title = decodeHtml(match[2]).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!title || !href.startsWith("/support/")) continue;
    if (/underwater housing|battery|charger|case|strap|adapter|remote/i.test(title)) continue;
    links.push({
      title,
      url: new URL(href, supportBaseUrl).href,
      normalizedTitle: normalizeSupportName(title),
    });
  }
  return links;
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
const olympusEntries = catalog
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
  .filter((entry) => entry.brand === "Olympus / OM System");

const missingEntries = olympusEntries.filter((entry) => !imageMap[entry.key]);
const legacyLinks = parseLegacyLinks(await fetchText(legacyIndexUrl));
const legacyLinksByTitle = new Map();
for (const link of legacyLinks) {
  const bucket = legacyLinksByTitle.get(link.normalizedTitle) || [];
  bucket.push(link);
  legacyLinksByTitle.set(link.normalizedTitle, bucket);
}

const added = [];
const skipped = [];
const pageCache = new Map();

async function loadPage(url) {
  if (!pageCache.has(url)) {
    pageCache.set(url, await fetchSupportPage(url));
  }
  return pageCache.get(url);
}

for (const entry of missingEntries) {
  const aliases = titleAliases(entry);
  const candidateUrls = new Set();

  for (const alias of aliases) {
    const matches = legacyLinksByTitle.get(alias) || [];
    for (const match of matches) {
      candidateUrls.add(match.url);
    }
  }

  for (const slug of supportSlugCandidates(entry)) {
    candidateUrls.add(`${supportBaseUrl}/support/${slug}`);
  }

  let accepted = null;
  for (const url of candidateUrls) {
    const page = await loadPage(url);
    if (!page || page.error) continue;
    const pageTitle = normalizeSupportName(page.title);
    if (!aliases.includes(pageTitle)) continue;
    accepted = page;
    break;
  }

  if (!accepted) {
    skipped.push(entry.model);
    continue;
  }

  imageMap[entry.key] = {
    src: accepted.src,
    alt: `Olympus / OM System ${entry.model}`,
  };
  added.push(`${entry.model} -> ${accepted.title}`);
}

if (added.length > 0) {
  fs.writeFileSync(productImagesPath, renderProductImages(imageMap));
}

console.log(`Olympus/OM catalog entries: ${olympusEntries.length}`);
console.log(`Missing before import: ${missingEntries.length}`);
console.log(`Legacy support links parsed: ${legacyLinks.length}`);
console.log(`Support pages fetched: ${pageCache.size}`);
console.log(`Added mappings: ${added.length}`);
for (const item of added) console.log(`+ ${item}`);
if (skipped.length) {
  console.log("\nStill unmatched:");
  for (const item of skipped.slice(0, 80)) console.log(`- ${item}`);
  if (skipped.length > 80) console.log(`... ${skipped.length - 80} more`);
}
