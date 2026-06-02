// Leica and Hasselblad catalog — premium camera systems sold new in the last 20 years.

const LEICA_CATALOG = {
  brand: "Leica",
  categories: [
    {
      name: "Camera Body — Mirrorless",
      items: [
        { name: "SL", year: 2015, ebayQuery: "Leica SL Typ 601 body" },
        { name: "SL2", year: 2019, ebayQuery: "Leica SL2 body" },
        { name: "SL2-S", year: 2020, ebayQuery: "Leica SL2-S body" },
        { name: "SL3", year: 2024, ebayQuery: "Leica SL3 body" },
        { name: "SL3-S", year: 2025, ebayQuery: "Leica SL3-S body", verified: "2026-05-31" },
        { name: "T", year: 2014, ebayQuery: "Leica T Typ 701 body" },
        { name: "TL2", year: 2017, ebayQuery: "Leica TL2 body" },
        { name: "CL", year: 2017, ebayQuery: "Leica CL digital body" },
      ],
    },
    {
      name: "Camera Body — Rangefinder",
      items: [
        { name: "M8", year: 2006, ebayQuery: "Leica M8 digital rangefinder body" },
        { name: "M9", year: 2009, ebayQuery: "Leica M9 digital rangefinder body" },
        { name: "M Typ 240", year: 2012, ebayQuery: "Leica M Typ 240 digital rangefinder body" },
        { name: "M10", year: 2017, ebayQuery: "Leica M10 digital rangefinder body" },
        { name: "M10-P", year: 2018, ebayQuery: "Leica M10-P digital rangefinder body" },
        { name: "M10-R", year: 2020, ebayQuery: "Leica M10-R digital rangefinder body" },
        { name: "M11", year: 2022, ebayQuery: "Leica M11 digital rangefinder body" },
        { name: "M11 Monochrom", year: 2023, ebayQuery: "Leica M11 Monochrom body" },
        { name: "M11-P", year: 2023, ebayQuery: "Leica M11-P digital rangefinder body" },
        { name: "M11-D", year: 2024, ebayQuery: "Leica M11-D digital rangefinder body" },
      ],
    },
    {
      name: "Camera Body — Digital",
      items: [
        { name: "Q", year: 2015, ebayQuery: "Leica Q Typ 116 camera" },
        { name: "Q2", year: 2019, ebayQuery: "Leica Q2 camera" },
        { name: "Q2 Monochrom", year: 2020, ebayQuery: "Leica Q2 Monochrom camera" },
        { name: "Q3", year: 2023, ebayQuery: "Leica Q3 camera" },
        { name: "Q3 43", year: 2024, ebayQuery: "Leica Q3 43 camera" },
        { name: "D-Lux 7", year: 2018, ebayQuery: "Leica D-Lux 7 camera" },
        { name: "D-Lux 8", year: 2024, ebayQuery: "Leica D-Lux 8 camera" },
      ],
    },
    {
      name: "Lens — L-Mount",
      items: [
        { name: "Super-Vario-Elmarit-SL 14-24mm f/2.8 ASPH.", year: 2023, ebayQuery: "Leica SL 14-24mm f2.8 lens" },
        { name: "Super-Vario-Elmar-SL 16-35mm f/3.5-4.5 ASPH.", year: 2018, ebayQuery: "Leica SL 16-35mm lens" },
        { name: "Vario-Elmarit-SL 24-70mm f/2.8 ASPH.", year: 2021, ebayQuery: "Leica SL 24-70mm f2.8 lens" },
        { name: "Vario-Elmarit-SL 24-90mm f/2.8-4 ASPH.", year: 2015, ebayQuery: "Leica SL 24-90mm lens" },
        { name: "APO-Vario-Elmarit-SL 90-280mm f/2.8-4", year: 2016, ebayQuery: "Leica SL 90-280mm lens" },
        { name: "Summilux-SL 50mm f/1.4 ASPH.", year: 2016, ebayQuery: "Leica SL 50mm f1.4 lens" },
        { name: "APO-Summicron-SL 35mm f/2 ASPH.", year: 2019, ebayQuery: "Leica SL 35mm f2 lens" },
        { name: "APO-Summicron-SL 50mm f/2 ASPH.", year: 2019, ebayQuery: "Leica SL 50mm f2 lens" },
        { name: "APO-Summicron-SL 75mm f/2 ASPH.", year: 2018, ebayQuery: "Leica SL 75mm f2 lens" },
        { name: "APO-Summicron-SL 90mm f/2 ASPH.", year: 2018, ebayQuery: "Leica SL 90mm f2 lens" },
      ],
    },
    {
      name: "Lens — M-Mount",
      items: [
        { name: "Summilux-M 28mm f/1.4 ASPH.", year: 2015, ebayQuery: "Leica Summilux-M 28mm f1.4 ASPH" },
        { name: "Summilux-M 35mm f/1.4 ASPH.", year: 2010, ebayQuery: "Leica Summilux-M 35mm f1.4 ASPH" },
        { name: "Summilux-M 50mm f/1.4 ASPH.", year: 2004, ebayQuery: "Leica Summilux-M 50mm f1.4 ASPH" },
        { name: "Noctilux-M 50mm f/0.95 ASPH.", year: 2008, ebayQuery: "Leica Noctilux-M 50mm f0.95 ASPH" },
        { name: "Noctilux-M 75mm f/1.25 ASPH.", year: 2017, ebayQuery: "Leica Noctilux-M 75mm f1.25 ASPH" },
        { name: "Summicron-M 28mm f/2 ASPH.", year: 2016, ebayQuery: "Leica Summicron-M 28mm f2 ASPH" },
        { name: "Summicron-M 35mm f/2 ASPH.", year: 2016, ebayQuery: "Leica Summicron-M 35mm f2 ASPH" },
        { name: "Summicron-M 50mm f/2", year: 2013, ebayQuery: "Leica Summicron-M 50mm f2 lens" },
        { name: "APO-Summicron-M 50mm f/2 ASPH.", year: 2012, ebayQuery: "Leica APO-Summicron-M 50mm f2 ASPH" },
        { name: "APO-Summicron-M 75mm f/2 ASPH.", year: 2005, ebayQuery: "Leica APO-Summicron-M 75mm f2 ASPH" },
        { name: "APO-Summicron-M 90mm f/2 ASPH.", year: 1998, ebayQuery: "Leica APO-Summicron-M 90mm f2 ASPH" },
      ],
    },
  ],
};

const HASSELBLAD_CATALOG = {
  brand: "Hasselblad",
  categories: [
    {
      name: "Camera Body — Medium Format",
      items: [
        { name: "X1D-50c", year: 2016, ebayQuery: "Hasselblad X1D-50c body" },
        { name: "X1D II 50C", year: 2019, ebayQuery: "Hasselblad X1D II 50C body" },
        { name: "907X 50C", year: 2020, ebayQuery: "Hasselblad 907X 50C body" },
        { name: "907X & CFV 100C", year: 2024, ebayQuery: "Hasselblad 907X CFV 100C body" },
        { name: "X2D 100C", year: 2022, ebayQuery: "Hasselblad X2D 100C body" },
      ],
    },
    {
      name: "Camera Body — Medium Format DSLR",
      items: [
        { name: "H4D-40", year: 2009, ebayQuery: "Hasselblad H4D-40 body" },
        { name: "H5D-40", year: 2012, ebayQuery: "Hasselblad H5D-40 body" },
        { name: "H5D-50c", year: 2014, ebayQuery: "Hasselblad H5D-50c body" },
        { name: "H6D-50c", year: 2016, ebayQuery: "Hasselblad H6D-50c body" },
        { name: "H6D-100c", year: 2016, ebayQuery: "Hasselblad H6D-100c body" },
      ],
    },
    {
      name: "Lens — Hasselblad XCD",
      items: [
        { name: "XCD 21mm f/4", year: 2018, ebayQuery: "Hasselblad XCD 21mm f4 lens" },
        { name: "XCD 25mm f/2.5 V", year: 2024, ebayQuery: "Hasselblad XCD 25mm f2.5 V lens" },
        { name: "XCD 28mm f/4 P", year: 2023, ebayQuery: "Hasselblad XCD 28mm f4 P lens" },
        { name: "XCD 30mm f/3.5", year: 2016, ebayQuery: "Hasselblad XCD 30mm f3.5 lens" },
        { name: "XCD 38mm f/2.5 V", year: 2022, ebayQuery: "Hasselblad XCD 38mm f2.5 V lens" },
        { name: "XCD 45mm f/3.5", year: 2016, ebayQuery: "Hasselblad XCD 45mm f3.5 lens" },
        { name: "XCD 45mm f/4 P", year: 2020, ebayQuery: "Hasselblad XCD 45mm f4 P lens" },
        { name: "XCD 55mm f/2.5 V", year: 2022, ebayQuery: "Hasselblad XCD 55mm f2.5 V lens" },
        { name: "XCD 65mm f/2.8", year: 2018, ebayQuery: "Hasselblad XCD 65mm f2.8 lens" },
        { name: "XCD 75mm f/3.4 P", year: 2024, ebayQuery: "Hasselblad XCD 75mm f3.4 P lens" },
        { name: "XCD 80mm f/1.9", year: 2018, ebayQuery: "Hasselblad XCD 80mm f1.9 lens" },
        { name: "XCD 90mm f/3.2", year: 2016, ebayQuery: "Hasselblad XCD 90mm f3.2 lens" },
        { name: "XCD 90mm f/2.5 V", year: 2022, ebayQuery: "Hasselblad XCD 90mm f2.5 V lens" },
        { name: "XCD 120mm f/3.5 Macro", year: 2017, ebayQuery: "Hasselblad XCD 120mm f3.5 Macro lens" },
        { name: "XCD 135mm f/2.8", year: 2018, ebayQuery: "Hasselblad XCD 135mm f2.8 lens" },
        { name: "XCD 20-35mm f/3.2-4.5 E", year: 2024, ebayQuery: "Hasselblad XCD 20-35mm lens" },
        { name: "XCD 35-75mm f/3.5-4.5", year: 2019, ebayQuery: "Hasselblad XCD 35-75mm lens" },
      ],
    },
  ],
};
