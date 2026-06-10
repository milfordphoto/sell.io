import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultCsvPaths = [
  "/Users/michaelwilson/Downloads/csv_merchandises-5421-1781085501.csv",
  "/Users/michaelwilson/Downloads/csv_merchandises-5421-1781085631.csv",
];

const csvPaths = process.argv.slice(2).length ? process.argv.slice(2) : defaultCsvPaths;
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

function parseDakisCsv(csvPath) {
  const text = fs.readFileSync(csvPath, "utf16le").replace(/^\uFEFF/, "");
  const rows = [];
  let header = null;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("# ID\t")) {
      header = line.slice(2).split("\t");
      continue;
    }
    const marker = line.replace(/^\uFEFF/, "").replace(/^"/, "").trim();
    if (!marker || marker.startsWith("#") || !header) continue;

    const parts = line.split("\t");
    rows.push(
      Object.fromEntries(header.map((name, index) => [name, parts[index] || ""])),
    );
  }
  return rows;
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
    .replace(/α/g, "alpha")
    .replace(/[–—]/g, "-")
    .replace(/\s+-\s+/g, " ")
    .replace(/\bf\//gi, "f")
    .replace(/\//g, "")
    .replace(/\(\s*\)/g, " ")
    .replace(/[^a-z0-9.+-]+/gi, " ")
    .replace(/(^|\s)-(?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function canonicalCatalogModel(value = "") {
  return normalizeMatchText(value);
}

function canonicalCsvProductName(value = "", category = "") {
  const isCamera = normalizeProductImageCategory(category) !== "lens";
  const cameraNoise = isCamera
    ? /\b(digital slr|dslr|mirrorless|camera|body only|body|only|black|silver|white|interchangeable lens|system camera|compact camera|high end|advanced)\b/gi
    : /\b(black|silver|white)\b/gi;

  return normalizeMatchText(value).replace(cameraNoise, " ").replace(/\s+/g, " ").trim();
}

function brandVariants(brand) {
  if (brand === "Olympus / OM System") return ["olympus", "om system"];
  if (brand === "Rokinon / Samyang") return ["rokinon", "samyang"];
  return [normalizeMatchText(brand)];
}

function isLikelyKitProduct(productName = "") {
  return /\b(with|kit|bundle|creator)\b/i.test(productName);
}

function scoreRow(row) {
  let score = 0;
  if (row.State === "2") score += 20;
  if (!isLikelyKitProduct(row["Product Name"])) score += 10;
  score -= row["Product Name"].length / 1000;
  return score;
}

function selectBestExactMatch(entry, rowsByBrand) {
  const category = normalizeProductImageCategory(entry.category);
  const model = canonicalCatalogModel(entry.model);
  if (!model || model.length < 4) return null;

  const candidates = brandVariants(entry.brand)
    .flatMap((brand) => rowsByBrand.get(brand) || [])
    .filter((row) => row["Product Image URL"]);

  const exactRows = candidates.filter((row) => {
    const product = canonicalCsvProductName(row["Product Name"], entry.category);
    if (product !== model) return false;
    if (category !== "lens" && isLikelyKitProduct(row["Product Name"])) return false;
    return true;
  });

  return exactRows.sort((a, b) => scoreRow(b) - scoreRow(a))[0] || null;
}

const genericLensTokens = new Set(
  [
    "lens",
    "lenses",
    "mount",
    "mounts",
    "for",
    "camera",
    "digital",
    "slr",
    "dslr",
    "mirrorless",
    "black",
    "silver",
    "white",
    "full",
    "frame",
    "aps",
    "c",
    "apsc",
    "series",
    "nikkor",
    "fujinon",
    "model",
    "cine",
    "photo",
    "dg",
    "dn",
    "di",
    "dc",
    "d",
  ],
);

const sensitiveLensTokens = new Set(
  [
    "ii",
    "iii",
    "iv",
    "v",
    "vi",
    "vii",
    "g2",
    "lm",
    "wr",
    "is",
    "ois",
    "oss",
    "stm",
    "usm",
    "ds",
    "pro",
    "pz",
    "vc",
    "usd",
    "vxd",
    "rxd",
    "hsm",
    "os",
    "apo",
    "macro",
    "tc",
    "power",
    "l",
    "se",
    "vr",
    "af",
    "af-s",
    "af-p",
    "z",
    "e",
    "ed",
    "xf",
    "gf",
    "gm",
    "g",
    "za",
    "fe",
    "rf",
    "ef",
    "ef-s",
    "r",
  ],
);

function matchTokens(value = "") {
  return normalizeMatchText(value).split(" ").filter(Boolean);
}

function lensModelTokens(value = "") {
  return matchTokens(value).filter((token) => !genericLensTokens.has(token));
}

function lensSignature(value = "") {
  const tokenText = matchTokens(value).join(" ");
  return {
    focal: (tokenText.match(/\b\d+(?:-\d+)?mm\b/) || [])[0],
    aperture: (tokenText.match(/\bf\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?[a-z]?\b/) || [])[0],
  };
}

function selectBestLensSignatureMatch(entry, rowsByBrand) {
  if (normalizeProductImageCategory(entry.category) !== "lens") return null;

  const signature = lensSignature(entry.model);
  if (!signature.focal || !signature.aperture) return null;

  const catalogTokens = lensModelTokens(entry.model);
  const catalogTokenSet = new Set(catalogTokens);
  const candidates = brandVariants(entry.brand)
    .flatMap((brand) => rowsByBrand.get(brand) || [])
    .filter((row) => row["Product Image URL"])
    .filter((row) => !isLikelyKitProduct(row["Product Name"]))
    .filter((row) => {
      const productTokens = lensModelTokens(row["Product Name"]);
      const productTokenSet = new Set(productTokens);
      if (!productTokenSet.has(signature.focal) || !productTokenSet.has(signature.aperture)) {
        return false;
      }
      if (!catalogTokens.every((token) => productTokenSet.has(token))) return false;

      for (const token of productTokenSet) {
        if (sensitiveLensTokens.has(token) && !catalogTokenSet.has(token)) return false;
      }

      return true;
    });

  return candidates.sort((a, b) => scoreRow(b) - scoreRow(a))[0] || null;
}

function normalizeDakisImageUrl(src) {
  if (!src.includes("cipher.dakiscdn.com")) return src;
  return src.replace(/([?&])w=\d+/g, "$1w=228").replace(/([?&])h=\d+/g, "$1h=228");
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
const csvRows = csvPaths.flatMap((csvPath) =>
  parseDakisCsv(csvPath).map((row) => ({
    ...row,
    sourceFile: path.basename(csvPath),
  })),
);

const rowsByBrand = new Map();
for (const row of csvRows) {
  const brand = normalizeMatchText(row.Brand);
  if (!row["Product Image URL"] || !brand) continue;
  if (!rowsByBrand.has(brand)) rowsByBrand.set(brand, []);
  rowsByBrand.get(brand).push(row);
}

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

const addedExact = [];
const addedLensSignature = [];
const existingExact = [];
const stillUnmatched = [];

for (const entry of catalogEntries) {
  const match = selectBestExactMatch(entry, rowsByBrand);
  if (!match) continue;

  if (imageMap[entry.key]) {
    existingExact.push({ entry, match });
    continue;
  }

  imageMap[entry.key] = {
    src: normalizeDakisImageUrl(match["Product Image URL"]),
    alt: `${entry.brand} ${entry.model}`,
  };
  addedExact.push({ entry, match });
}

for (const entry of catalogEntries) {
  if (imageMap[entry.key]) continue;
  const match = selectBestLensSignatureMatch(entry, rowsByBrand);
  if (!match) continue;

  imageMap[entry.key] = {
    src: normalizeDakisImageUrl(match["Product Image URL"]),
    alt: `${entry.brand} ${entry.model}`,
  };
  addedLensSignature.push({ entry, match });
}

for (const entry of catalogEntries) {
  if (!imageMap[entry.key]) {
    stillUnmatched.push(entry);
  }
}

fs.writeFileSync(productImagesPath, renderProductImages(imageMap));

console.log(`Dakis CSV rows read: ${csvRows.length}`);
console.log(`Rows with product image URLs: ${csvRows.filter((row) => row["Product Image URL"]).length}`);
console.log(`Catalog entries: ${catalogEntries.length}`);
console.log(`Existing exact CSV matches already mapped: ${existingExact.length}`);
console.log(`New exact CSV image mappings added: ${addedExact.length}`);
console.log(`New lens-signature CSV image mappings added: ${addedLensSignature.length}`);
console.log(`Still unmatched after CSV passes: ${stillUnmatched.length}`);

if (addedExact.length) {
  console.log("\nAdded exact mappings:");
  for (const { entry, match } of addedExact) {
    console.log(`- ${entry.brand} | ${entry.category} | ${entry.model} <= ${match.Brand} | ${match["Product Name"]} (${match.sourceFile})`);
  }
}

if (addedLensSignature.length) {
  console.log("\nAdded lens-signature mappings:");
  for (const { entry, match } of addedLensSignature) {
    console.log(`- ${entry.brand} | ${entry.category} | ${entry.model} <= ${match.Brand} | ${match["Product Name"]} (${match.sourceFile})`);
  }
}
