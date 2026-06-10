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

const sonySources = [
  {
    category: "digital camera",
    model: "α6100",
    url: "https://electronics.sony.com/imaging/interchangeable-lens-cameras/aps-c/p/ilce6100-b",
    titlePattern: /alpha\s+6100|ilce6100/i,
  },
  {
    category: "digital camera",
    model: "α6400",
    url: "https://electronics.sony.com/imaging/interchangeable-lens-cameras/aps-c/p/ilce6400-b",
    titlePattern: /alpha\s+6400|ilce6400/i,
  },
  {
    category: "digital camera",
    model: "α6600",
    url: "https://electronics.sony.com/imaging/interchangeable-lens-cameras/aps-c/p/ilce6600-b",
    titlePattern: /alpha\s+6600|ilce6600/i,
  },
  {
    category: "digital camera",
    model: "α7 III",
    url: "https://electronics.sony.com/imaging/interchangeable-lens-cameras/full-frame/p/ilce7m3-b",
    titlePattern: /alpha\s+7\s+iii|ilce7m3/i,
  },
  {
    category: "digital camera",
    model: "α7C",
    url: "https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilce7c-b",
    titlePattern: /alpha\s+7c|ilce7c/i,
  },
  {
    category: "digital camera",
    model: "α7C II",
    url: "https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilce7cm2b",
    directImage: "https://d1ncau8tqf99kp.cloudfront.net/converted/116356_original_local_1200x1050_v3_converted.webp",
    titlePattern: /alpha\s+7c\s+ii|ilce-?7cm2/i,
  },
  {
    category: "digital camera",
    model: "α7CR",
    url: "https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilce7crb",
    titlePattern: /alpha\s+7cr|ilce-?7cr/i,
  },
  {
    category: "digital camera",
    model: "α7R V",
    url: "https://electronics.sony.com/imaging/interchangeable-lens-cameras/full-frame/p/ilce7rm5-b",
    titlePattern: /a7rv|a7r5|ilce7rm5/i,
  },
  {
    category: "digital camera",
    model: "α7S III",
    url: "https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilce7sm3-b",
    titlePattern: /a7s\s+iii|ilce7sm3/i,
  },
  {
    category: "digital camera",
    model: "Alpha 1",
    url: "https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilce1-b",
    titlePattern: /alpha\s+1|ilce1/i,
  },
  {
    category: "digital camera",
    model: "α9 II",
    url: "https://electronics.sony.com/imaging/interchangeable-lens-cameras/full-frame/p/ilce9m2-b",
    titlePattern: /a9\s+ii|ilce9m2/i,
  },
  {
    category: "digital camera",
    model: "α9 III",
    url: "https://electronics.sony.com/imaging/interchangeable-lens-cameras/all-interchangeable-lens-cameras/p/ilce9m3b",
    directImage: "https://d1ncau8tqf99kp.cloudfront.net/converted/117670_original_local_1200x1050_v3_converted.webp",
    titlePattern: /alpha\s+9\s+iii|ilce9m3/i,
  },
  {
    category: "digital camera",
    model: "ZV-E10 II",
    url: "https://electronics.sony.com/imaging/interchangeable-lens-cameras/aps-c/p/zve10m2b",
    directImage: "https://d1ncau8tqf99kp.cloudfront.net/converted/120973_original_local_1200x1050_v3_converted.webp",
    titlePattern: /zv-e10\s+ii|zve10m2/i,
  },
  {
    category: "lens",
    model: "FE 28-70mm f/2 GM",
    url: "https://electronics.sony.com/imaging/lenses/all-e-mount/p/sel2870gm",
    titlePattern: /28-70mm\s+f2\s+gm|sel2870gm/i,
  },
  {
    category: "lens",
    model: "FE 28-60mm f/4-5.6",
    url: "https://electronics.sony.com/imaging/lenses/full-frame-e-mount/p/sel2860",
    titlePattern: /28-60mm\s+f4-5\.6|sel2860/i,
  },
  {
    category: "lens",
    model: "FE 70-200mm f/2.8 GM OSS",
    url: "https://electronics.sony.com/imaging/lenses/all-e-mount/p/sel70200gm",
    titlePattern: /70-200mm\s+f\/?2\.8\s+gm\s+oss|sel70200gm/i,
  },
  {
    category: "lens",
    model: "FE 600mm f/4 GM OSS",
    url: "https://electronics.sony.com/imaging/lenses/all-e-mount/p/sel600f40gm",
    titlePattern: /600\s*mm\s+f4\s+gm\s+oss|sel600f40gm/i,
  },
  {
    category: "lens",
    model: "FE 28mm f/2",
    url: "https://electronics.sony.com/imaging/lenses/all-e-mount/p/sel28f20",
    titlePattern: /28mm\s+f\/?2|sel28f20/i,
  },
  {
    category: "lens",
    model: "FE 100mm f/2.8 STF GM OSS",
    url: "https://electronics.sony.com/imaging/lenses/full-frame-e-mount/p/sel100f28gm",
    titlePattern: /100mm\s+f2\.8\s+stf\s+gm\s+oss|sel100f28gm/i,
  },
  {
    category: "lens",
    model: "FE 135mm f/1.8 GM",
    url: "https://electronics.sony.com/imaging/lenses/all-e-mount/p/sel135f18gm",
    titlePattern: /135mm\s+f\/?1\.8\s+gm|sel135f18gm/i,
  },
  {
    category: "lens",
    model: "FE 1.4x Teleconverter",
    url: "https://electronics.sony.com/imaging/lenses/all-e-mount/p/sel14tc",
    titlePattern: /1\.4x\s+teleconverter|sel14tc/i,
  },
  {
    category: "lens",
    model: "FE 2x Teleconverter",
    url: "https://electronics.sony.com/imaging/lenses/all-e-mount/p/sel20tc",
    titlePattern: /2x\s+teleconverter|sel20tc/i,
  },
  {
    category: "lens",
    model: "E 18-135mm f/3.5-5.6 OSS",
    url: "https://electronics.sony.com/imaging/lenses/aps-c-e-mount/p/sel18135",
    titlePattern: /18-135\s*mm|sel18135/i,
  },
  {
    category: "flash",
    model: "HVL-F43M",
    url: "https://electronics.sony.com/imaging/imaging-accessories/interchangeable-lens-camera-accessories/p/hvlf43m",
    titlePattern: /f43m|hvlf43m/i,
  },
  {
    category: "flash",
    model: "HVL-F45RM",
    url: "https://electronics.sony.com/imaging/imaging-accessories/all-accessories/p/hvlf45rm",
    titlePattern: /f45rm|hvlf45rm/i,
  },
  {
    category: "flash",
    model: "HVL-F46RM",
    url: "https://electronics.sony.com/imaging/imaging-accessories/all-accessories/p/hvlf46rm",
    titlePattern: /f46rm|hvlf46rm/i,
  },
  {
    category: "flash",
    model: "HVL-F60M",
    url: "https://electronics.sony.com/imaging/imaging-accessories/interchangeable-lens-camera-accessories/p/hvlf60m",
    titlePattern: /f60m|hvlf60m/i,
  },
  {
    category: "flash",
    model: "HVL-F60RM2",
    url: "https://electronics.sony.com/imaging/imaging-accessories/all-accessories/p/hvlf60rm2",
    titlePattern: /f60rm2|hvlf60rm2/i,
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

function decodeHtml(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
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

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Milford Photo used gear image catalog updater",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return {
      finalUrl: response.url,
      html: await response.text(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractSonyPage(html, finalUrl) {
  const title = decodeHtml((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "")
    .replace(/\s+/g, " ")
    .trim();
  const image =
    (html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i) || [])[1] ||
    (html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) || [])[1] ||
    "";
  return {
    title,
    image: decodeHtml(image),
    finalUrl,
  };
}

function isUsableSonyProductPage(page, source) {
  if (!page.image || !page.image.startsWith("https://")) return false;
  if (/not-found|sony-logo|404-page/i.test(`${page.finalUrl} ${page.title} ${page.image}`)) return false;
  return source.titlePattern.test(page.title);
}

async function verifyImage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    let response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Milford Photo used gear image catalog updater",
      },
    });
    if (!response.ok) {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Range: "bytes=0-1023",
          "User-Agent": "Milford Photo used gear image catalog updater",
        },
      });
    }
    const contentType = response.headers.get("content-type") || "";
    return (
      response.ok &&
      (contentType.startsWith("image/") || (/application\/octet-stream/i.test(contentType) && /\.(?:webp|png|jpe?g)$/i.test(url)))
    );
  } finally {
    clearTimeout(timeout);
  }
}

const catalog = loadCatalog();
const catalogKeys = new Set(
  catalog.flatMap((brand) =>
    brand.categories.flatMap((category) =>
      category.items.map((item) => productImageKey(brand.brand, category.name, item.name)),
    ),
  ),
);
const imageMap = { ...loadImageMap() };

const added = [];
const skipped = [];

for (const source of sonySources) {
  const key = productImageKey("Sony", source.category, source.model);
  if (!catalogKeys.has(key)) {
    skipped.push(`${source.model}: no catalog key`);
    continue;
  }
  if (imageMap[key]) {
    skipped.push(`${source.model}: already mapped`);
    continue;
  }

  try {
    const { finalUrl, html } = await fetchText(source.url);
    const page = extractSonyPage(html, finalUrl);
    if (!isUsableSonyProductPage(page, source) && !source.directImage) {
      skipped.push(`${source.model}: page/image did not pass checks (${page.title || finalUrl})`);
      continue;
    }

    const image = isUsableSonyProductPage(page, source) ? page.image : source.directImage;
    if (image === source.directImage && !(await verifyImage(image))) {
      skipped.push(`${source.model}: direct image did not pass HEAD check`);
      continue;
    }

    imageMap[key] = {
      src: image,
      alt: `Sony ${source.model}`,
    };
    added.push(`${source.model} -> ${image}`);
  } catch (error) {
    skipped.push(`${source.model}: ${error.name || "Error"} ${error.message}`);
  }
}

if (added.length) {
  fs.writeFileSync(productImagesPath, renderProductImages(imageMap));
}

console.log(`Sony official mappings added: ${added.length}`);
for (const item of added) console.log(`+ ${item}`);
console.log(`Sony official mappings skipped: ${skipped.length}`);
for (const item of skipped) console.log(`- ${item}`);
