// Supplemental camera and lighting catalogs for brands not covered by the primary system files.

const RICOH_CATALOG = {
  brand: "Ricoh",
  categories: [
    {
      name: "Camera Body — Digital",
      items: [
        { name: "GR Digital", year: 2005, ebayQuery: "Ricoh GR Digital camera" },
        { name: "GR Digital II", year: 2007, ebayQuery: "Ricoh GR Digital II camera" },
        { name: "GR Digital III", year: 2009, ebayQuery: "Ricoh GR Digital III camera" },
        { name: "GR Digital IV", year: 2011, ebayQuery: "Ricoh GR Digital IV camera" },
        { name: "GR", year: 2013, ebayQuery: "Ricoh GR APS-C camera" },
        { name: "GR II", year: 2015, ebayQuery: "Ricoh GR II camera" },
        { name: "GR III", year: 2019, ebayQuery: "Ricoh GR III camera" },
        { name: "GR IIIx", year: 2021, ebayQuery: "Ricoh GR IIIx camera" },
        { name: "GR III HDF", year: 2024, ebayQuery: "Ricoh GR III HDF camera" },
        { name: "GR IIIx HDF", year: 2024, ebayQuery: "Ricoh GR IIIx HDF camera" },
        { name: "GXR", year: 2009, ebayQuery: "Ricoh GXR camera body" },
      ],
    },
  ],
};

const NISSIN_CATALOG = {
  brand: "Nissin",
  categories: [
    {
      name: "Flash / Speedlight",
      items: [
        { name: "i40", year: 2014, ebayQuery: "Nissin i40 flash" },
        { name: "i60A", year: 2016, ebayQuery: "Nissin i60A flash" },
        { name: "Di700A", year: 2015, ebayQuery: "Nissin Di700A flash" },
        { name: "MG8000 Extreme", year: 2012, ebayQuery: "Nissin MG8000 Extreme flash" },
        { name: "MG10", year: 2018, ebayQuery: "Nissin MG10 flash" },
        { name: "Air 10s Commander", year: 2017, ebayQuery: "Nissin Air 10s commander" },
      ],
    },
  ],
};

const WESTCOTT_CATALOG = {
  brand: "Westcott",
  categories: [
    {
      name: "Flash / Strobe",
      items: [
        { name: "FJ80 Speedlight", year: 2020, ebayQuery: "Westcott FJ80 speedlight" },
        { name: "FJ80 II Speedlight", year: 2023, ebayQuery: "Westcott FJ80 II speedlight" },
        { name: "FJ200 Strobe", year: 2020, ebayQuery: "Westcott FJ200 strobe" },
        { name: "FJ400 Strobe", year: 2019, ebayQuery: "Westcott FJ400 strobe" },
        { name: "FJ400 II Strobe", year: 2024, ebayQuery: "Westcott FJ400 II strobe" },
        { name: "FJ-X3 Trigger", year: 2020, ebayQuery: "Westcott FJ-X3 trigger" },
      ],
    },
  ],
};

const ELINCHROM_CATALOG = {
  brand: "Elinchrom",
  categories: [
    {
      name: "Flash / Strobe",
      items: [
        { name: "D-Lite RX 4", year: 2013, ebayQuery: "Elinchrom D-Lite RX 4 strobe" },
        { name: "ELC 125", year: 2020, ebayQuery: "Elinchrom ELC 125 strobe" },
        { name: "ELC 500", year: 2020, ebayQuery: "Elinchrom ELC 500 strobe" },
        { name: "ELB 500 TTL", year: 2018, ebayQuery: "Elinchrom ELB 500 TTL strobe" },
        { name: "ELB 1200", year: 2017, ebayQuery: "Elinchrom ELB 1200 strobe" },
        { name: "ONE Off Camera Flash", year: 2021, ebayQuery: "Elinchrom ONE off camera flash" },
        { name: "THREE Off Camera Flash", year: 2023, ebayQuery: "Elinchrom THREE off camera flash" },
        { name: "Skyport Transmitter Pro", year: 2016, ebayQuery: "Elinchrom Skyport Transmitter Pro" },
      ],
    },
  ],
};

const PHASE_ONE_CATALOG = {
  brand: "Phase One",
  categories: [
    {
      name: "Camera Body — Medium Format",
      items: [
        {
          name: "XF Camera System",
          year: 2015,
          ebayQuery: "Phase One XF camera body",
          manualReview: true,
        },
        {
          name: "XT Camera Body",
          year: 2019,
          ebayQuery: "Phase One XT camera body",
          manualReview: true,
        },
        {
          name: "IQ3 100MP Digital Back",
          year: 2016,
          ebayQuery: "Phase One IQ3 100MP digital back",
          manualReview: true,
        },
        {
          name: "IQ4 150MP Digital Back",
          year: 2018,
          ebayQuery: "Phase One IQ4 150MP digital back",
          manualReview: true,
        },
        {
          name: "IQ4 150MP Achromatic Digital Back",
          year: 2019,
          ebayQuery: "Phase One IQ4 150MP Achromatic digital back",
          manualReview: true,
        },
      ],
    },
    {
      name: "Lens — Phase One XF",
      items: [
        {
          name: "Schneider Kreuznach 35mm f/3.5 LS Blue Ring",
          mounts: ["Phase One XF"],
          year: 2015,
          ebayQuery: "Phase One Schneider Kreuznach 35mm LS Blue Ring lens",
          manualReview: true,
        },
        {
          name: "Schneider Kreuznach 45mm f/3.5 LS Blue Ring",
          mounts: ["Phase One XF"],
          year: 2015,
          ebayQuery: "Phase One Schneider Kreuznach 45mm LS Blue Ring lens",
          manualReview: true,
        },
        {
          name: "Schneider Kreuznach 55mm f/2.8 LS Blue Ring",
          mounts: ["Phase One XF"],
          year: 2015,
          ebayQuery: "Phase One Schneider Kreuznach 55mm LS Blue Ring lens",
          manualReview: true,
        },
        {
          name: "Schneider Kreuznach 80mm f/2.8 LS Blue Ring",
          mounts: ["Phase One XF"],
          year: 2015,
          ebayQuery: "Phase One Schneider Kreuznach 80mm LS Blue Ring lens",
          manualReview: true,
        },
        {
          name: "Schneider Kreuznach 110mm f/2.8 LS Blue Ring",
          mounts: ["Phase One XF"],
          year: 2015,
          ebayQuery: "Phase One Schneider Kreuznach 110mm LS Blue Ring lens",
          manualReview: true,
        },
        {
          name: "Schneider Kreuznach 120mm f/4 LS Macro Blue Ring",
          mounts: ["Phase One XF"],
          year: 2015,
          ebayQuery: "Phase One Schneider Kreuznach 120mm LS Macro Blue Ring lens",
          manualReview: true,
        },
        {
          name: "Schneider Kreuznach 150mm f/2.8 LS Blue Ring",
          mounts: ["Phase One XF"],
          year: 2015,
          ebayQuery: "Phase One Schneider Kreuznach 150mm LS Blue Ring lens",
          manualReview: true,
        },
        {
          name: "Schneider Kreuznach 240mm f/4.5 LS Blue Ring",
          mounts: ["Phase One XF"],
          year: 2015,
          ebayQuery: "Phase One Schneider Kreuznach 240mm LS Blue Ring lens",
          manualReview: true,
        },
        {
          name: "Schneider Kreuznach 75-150mm f/4-5.6 LS Blue Ring",
          mounts: ["Phase One XF"],
          year: 2015,
          ebayQuery: "Phase One Schneider Kreuznach 75-150mm LS Blue Ring lens",
          manualReview: true,
        },
      ],
    },
  ],
};

const VOIGTLANDER_CATALOG = {
  brand: "Voigtlander",
  categories: [
    {
      name: "Lens — Voigtlander",
      items: [
        { name: "10.5mm f/0.95 Nokton (Micro Four Thirds)", quoteModel: "10.5mm f/0.95 Nokton", mounts: ["Micro Four Thirds"], year: 2015, ebayQuery: "Voigtlander 10.5mm f0.95 Nokton Micro Four Thirds" },
        { name: "17.5mm f/0.95 Nokton (Micro Four Thirds)", quoteModel: "17.5mm f/0.95 Nokton", mounts: ["Micro Four Thirds"], year: 2012, ebayQuery: "Voigtlander 17.5mm f0.95 Nokton Micro Four Thirds" },
        { name: "25mm f/0.95 Nokton Type II (Micro Four Thirds)", quoteModel: "25mm f/0.95 Nokton Type II", mounts: ["Micro Four Thirds"], year: 2014, ebayQuery: "Voigtlander 25mm f0.95 Nokton Type II Micro Four Thirds" },
        { name: "42.5mm f/0.95 Nokton (Micro Four Thirds)", quoteModel: "42.5mm f/0.95 Nokton", mounts: ["Micro Four Thirds"], year: 2013, ebayQuery: "Voigtlander 42.5mm f0.95 Nokton Micro Four Thirds" },
        { name: "15mm f/4.5 Super Wide Heliar III VM (Leica M)", quoteModel: "15mm f/4.5 Super Wide Heliar III VM", mounts: ["Leica M"], year: 2015, ebayQuery: "Voigtlander 15mm f4.5 Super Wide Heliar III VM" },
        { name: "21mm f/1.4 Nokton VM (Leica M)", quoteModel: "21mm f/1.4 Nokton VM", mounts: ["Leica M"], year: 2020, ebayQuery: "Voigtlander 21mm f1.4 Nokton VM" },
        { name: "35mm f/1.2 Nokton VM III (Leica M)", quoteModel: "35mm f/1.2 Nokton VM III", mounts: ["Leica M"], year: 2020, ebayQuery: "Voigtlander 35mm f1.2 Nokton VM III" },
        { name: "35mm f/1.4 Nokton Classic VM II (Leica M)", quoteModel: "35mm f/1.4 Nokton Classic VM II", mounts: ["Leica M"], year: 2019, ebayQuery: "Voigtlander 35mm f1.4 Nokton Classic VM II" },
        { name: "40mm f/1.2 Nokton Aspherical SE (Sony E)", quoteModel: "40mm f/1.2 Nokton Aspherical SE", mounts: ["Sony E"], year: 2020, ebayQuery: "Voigtlander 40mm f1.2 Nokton Aspherical SE Sony E" },
        { name: "50mm f/1.0 Nokton ASPH VM (Leica M)", quoteModel: "50mm f/1.0 Nokton ASPH VM", mounts: ["Leica M"], year: 2022, ebayQuery: "Voigtlander 50mm f1.0 Nokton ASPH VM" },
        { name: "50mm f/1.2 Nokton ASPH VM (Leica M)", quoteModel: "50mm f/1.2 Nokton ASPH VM", mounts: ["Leica M"], year: 2018, ebayQuery: "Voigtlander 50mm f1.2 Nokton ASPH VM" },
        { name: "50mm f/2 APO-Lanthar (Sony E)", quoteModel: "50mm f/2 APO-Lanthar", mounts: ["Sony E"], year: 2019, ebayQuery: "Voigtlander 50mm f2 APO-Lanthar Sony E" },
        { name: "50mm f/2 APO-Lanthar (Nikon Z)", quoteModel: "50mm f/2 APO-Lanthar Z", mounts: ["Nikon Z"], year: 2021, ebayQuery: "Voigtlander 50mm f2 APO-Lanthar Nikon Z" },
        { name: "65mm f/2 Macro APO-Lanthar (Sony E)", quoteModel: "65mm f/2 Macro APO-Lanthar", mounts: ["Sony E"], year: 2017, ebayQuery: "Voigtlander 65mm f2 Macro APO-Lanthar Sony E" },
        { name: "75mm f/1.5 Nokton VM (Leica M)", quoteModel: "75mm f/1.5 Nokton VM", mounts: ["Leica M"], year: 2019, ebayQuery: "Voigtlander 75mm f1.5 Nokton VM" },
        { name: "90mm f/2.8 APO-Skopar VM (Leica M)", quoteModel: "90mm f/2.8 APO-Skopar VM", mounts: ["Leica M"], year: 2021, ebayQuery: "Voigtlander 90mm f2.8 APO-Skopar VM" },
        { name: "110mm f/2.5 Macro APO-Lanthar (Sony E)", quoteModel: "110mm f/2.5 Macro APO-Lanthar", mounts: ["Sony E"], year: 2018, ebayQuery: "Voigtlander 110mm f2.5 Macro APO-Lanthar Sony E" },
      ],
    },
  ],
};

const ROKINON_SAMYANG_CATALOG = {
  brand: "Rokinon / Samyang",
  categories: [
    {
      name: "Lens — Rokinon / Samyang",
      items: [
        { name: "AF 14mm f/2.8 FE (Sony E)", quoteModel: "AF 14mm f/2.8 FE", mounts: ["Sony E"], year: 2016, ebayQuery: "Samyang Rokinon AF 14mm f2.8 FE" },
        { name: "AF 18mm f/2.8 FE (Sony E)", quoteModel: "AF 18mm f/2.8 FE", mounts: ["Sony E"], year: 2019, ebayQuery: "Samyang Rokinon AF 18mm f2.8 FE" },
        { name: "AF 24mm f/1.8 FE (Sony E)", quoteModel: "AF 24mm f/1.8 FE", mounts: ["Sony E"], year: 2021, ebayQuery: "Samyang Rokinon AF 24mm f1.8 FE" },
        { name: "AF 35mm f/1.8 FE (Sony E)", quoteModel: "AF 35mm f/1.8 FE", mounts: ["Sony E"], year: 2020, ebayQuery: "Samyang Rokinon AF 35mm f1.8 FE" },
        { name: "AF 45mm f/1.8 FE (Sony E)", quoteModel: "AF 45mm f/1.8 FE", mounts: ["Sony E"], year: 2019, ebayQuery: "Samyang Rokinon AF 45mm f1.8 FE" },
        { name: "AF 50mm f/1.4 FE II (Sony E)", quoteModel: "AF 50mm f/1.4 FE II", mounts: ["Sony E"], year: 2021, ebayQuery: "Samyang Rokinon AF 50mm f1.4 FE II" },
        { name: "AF 75mm f/1.8 FE (Sony E)", quoteModel: "AF 75mm f/1.8 FE", mounts: ["Sony E"], year: 2020, ebayQuery: "Samyang Rokinon AF 75mm f1.8 FE" },
        { name: "AF 85mm f/1.4 FE II (Sony E)", quoteModel: "AF 85mm f/1.4 FE II", mounts: ["Sony E"], year: 2022, ebayQuery: "Samyang Rokinon AF 85mm f1.4 FE II" },
        { name: "AF 135mm f/1.8 FE (Sony E)", quoteModel: "AF 135mm f/1.8 FE", mounts: ["Sony E"], year: 2022, ebayQuery: "Samyang Rokinon AF 135mm f1.8 FE" },
        { name: "12mm f/2 NCS CS (APS-C)", quoteModel: "12mm f/2 NCS CS", mounts: ["Sony E", "Fujifilm X", "Canon EF-M", "Micro Four Thirds"], year: 2014, ebayQuery: "Rokinon Samyang 12mm f2 NCS CS" },
        { name: "14mm f/2.8 ED AS IF UMC (DSLR/Mirrorless)", quoteModel: "14mm f/2.8 ED AS IF UMC", mounts: ["Canon EF", "Nikon F", "Sony E"], year: 2009, ebayQuery: "Rokinon Samyang 14mm f2.8 ED UMC" },
        { name: "135mm f/2 ED UMC (DSLR/Mirrorless)", quoteModel: "135mm f/2 ED UMC", mounts: ["Canon EF", "Nikon F", "Sony E"], year: 2015, ebayQuery: "Rokinon Samyang 135mm f2 ED UMC" },
      ],
    },
  ],
};

const LAOWA_CATALOG = {
  brand: "Laowa",
  categories: [
    {
      name: "Lens — Laowa",
      items: [
        { name: "9mm f/2.8 Zero-D", mounts: ["Sony E", "Fujifilm X", "Canon EF-M", "Micro Four Thirds"], year: 2018, ebayQuery: "Laowa 9mm f2.8 Zero-D lens" },
        { name: "10-18mm f/4.5-5.6 FE Zoom", mounts: ["Sony E"], year: 2018, ebayQuery: "Laowa 10-18mm f4.5-5.6 FE zoom" },
        { name: "11mm f/4.5 FF RL", mounts: ["Sony E", "Nikon Z", "Leica M", "L-Mount"], year: 2020, ebayQuery: "Laowa 11mm f4.5 FF RL lens" },
        { name: "15mm f/2 Zero-D", mounts: ["Sony E", "Canon RF", "Nikon Z", "L-Mount"], year: 2017, ebayQuery: "Laowa 15mm f2 Zero-D lens" },
        { name: "24mm f/14 2x Macro Probe", mounts: ["Canon EF", "Nikon F", "Sony E", "Canon RF", "Nikon Z", "L-Mount"], year: 2018, ebayQuery: "Laowa 24mm f14 2x Macro Probe lens" },
        { name: "25mm f/2.8 2.5-5x Ultra Macro", mounts: ["Canon EF", "Nikon F", "Sony E", "Canon RF", "Nikon Z", "L-Mount"], year: 2018, ebayQuery: "Laowa 25mm f2.8 2.5-5x Ultra Macro lens" },
        { name: "60mm f/2.8 2x Ultra Macro", mounts: ["Canon EF", "Nikon F", "Sony E"], year: 2015, ebayQuery: "Laowa 60mm f2.8 2x Ultra Macro lens" },
        { name: "90mm f/2.8 2x Ultra Macro APO", mounts: ["Sony E", "Canon RF", "Nikon Z", "L-Mount"], year: 2022, ebayQuery: "Laowa 90mm f2.8 2x Ultra Macro APO lens" },
        { name: "100mm f/2.8 2x Ultra Macro APO", mounts: ["Canon EF", "Nikon F", "Sony E", "Canon RF", "Nikon Z", "L-Mount"], year: 2019, ebayQuery: "Laowa 100mm f2.8 2x Ultra Macro APO lens" },
        { name: "Argus 33mm f/0.95 CF APO", mounts: ["Sony E", "Fujifilm X", "Nikon Z", "Canon RF"], year: 2021, ebayQuery: "Laowa Argus 33mm f0.95 CF APO lens" },
        { name: "Argus 35mm f/0.95 FF", mounts: ["Sony E", "Canon RF", "Nikon Z"], year: 2021, ebayQuery: "Laowa Argus 35mm f0.95 FF lens" },
        { name: "Argus 45mm f/0.95 FF", mounts: ["Sony E", "Canon RF", "Nikon Z"], year: 2021, ebayQuery: "Laowa Argus 45mm f0.95 FF lens" },
        { name: "105mm f/2 Smooth Trans Focus", mounts: ["Canon EF", "Nikon F", "Sony E"], year: 2016, ebayQuery: "Laowa 105mm f2 Smooth Trans Focus lens" },
      ],
    },
  ],
};

const VILTROX_CATALOG = {
  brand: "Viltrox",
  categories: [
    {
      name: "Lens — Viltrox",
      items: [
        { name: "AF 13mm f/1.4", mounts: ["Sony E", "Fujifilm X", "Nikon Z"], year: 2022, ebayQuery: "Viltrox AF 13mm f1.4 lens" },
        { name: "AF 16mm f/1.8", mounts: ["Sony E", "Nikon Z"], year: 2023, ebayQuery: "Viltrox AF 16mm f1.8 lens" },
        { name: "AF 20mm f/2.8", mounts: ["Sony E", "Nikon Z"], year: 2023, ebayQuery: "Viltrox AF 20mm f2.8 lens" },
        { name: "AF 23mm f/1.4", mounts: ["Sony E", "Fujifilm X", "Nikon Z"], year: 2020, ebayQuery: "Viltrox AF 23mm f1.4 lens" },
        { name: "AF 27mm f/1.2 Pro", mounts: ["Sony E", "Fujifilm X", "Nikon Z"], year: 2023, ebayQuery: "Viltrox AF 27mm f1.2 Pro lens" },
        { name: "AF 33mm f/1.4", mounts: ["Sony E", "Fujifilm X", "Nikon Z"], year: 2020, ebayQuery: "Viltrox AF 33mm f1.4 lens" },
        { name: "AF 40mm f/2.5", mounts: ["Sony E", "Nikon Z"], year: 2024, ebayQuery: "Viltrox AF 40mm f2.5 lens" },
        { name: "AF 50mm f/2 Air", mounts: ["Sony E", "Nikon Z"], year: 2024, ebayQuery: "Viltrox AF 50mm f2 Air lens" },
        { name: "AF 56mm f/1.4", mounts: ["Sony E", "Fujifilm X", "Nikon Z"], year: 2020, ebayQuery: "Viltrox AF 56mm f1.4 lens" },
        { name: "AF 75mm f/1.2 Pro", mounts: ["Sony E", "Fujifilm X", "Nikon Z"], year: 2022, ebayQuery: "Viltrox AF 75mm f1.2 Pro lens" },
        { name: "AF 85mm f/1.8 II", mounts: ["Sony E", "Nikon Z"], year: 2019, ebayQuery: "Viltrox AF 85mm f1.8 II lens" },
        { name: "AF 135mm f/1.8 LAB", mounts: ["Sony E", "Nikon Z"], year: 2024, ebayQuery: "Viltrox AF 135mm f1.8 LAB lens" },
      ],
    },
  ],
};

const SUPPLEMENTAL_CATALOGS = [
  RICOH_CATALOG,
  NISSIN_CATALOG,
  WESTCOTT_CATALOG,
  ELINCHROM_CATALOG,
  PHASE_ONE_CATALOG,
  VOIGTLANDER_CATALOG,
  ROKINON_SAMYANG_CATALOG,
  LAOWA_CATALOG,
  VILTROX_CATALOG,
];
