/** GrowMedica.cz — single source of truth for brand copy and tokens */

export const BRAND_COLORS = {
  primary: '#166534',
  primaryBright: '#35C79A',
  primaryDark: '#14532d',
  primaryLight: '#E7F8F2',
  text: '#101615',
  footerBg: '#101615',
  white: '#FFFFFF',
} as const

/** Legacy navy palette — must not appear in UI */
export const LEGACY_COLORS = {
  navy: '#1E3A5F',
  navyDark: '#152B46',
  oldGreen: '#6BAE2E',
} as const

export const ANNOUNCEMENT_BAR = {
  enabled: true,
  message: 'Doprava zdarma od 50 € · Overené biomedicínske doplnky stravy',
  href: '/doprava-a-platba',
  linkLabel: 'Viac info',
} as const

export const SHIPPING_TAB_CONTENT = [
  'Objednávky odosielame do 24 hodín v pracovné dni. Doručenie na Slovensko zvyčajne trvá 1–3 pracovné dni.',
  'Ak vám produkt nevyhovuje, môžete ho vrátiť do 30 dní od prevzatia podľa našich obchodných podmienok.',
  'Viac o doprave, platbe a reklamáciách nájdete v sekcii Doprava a platba.',
] as const

export const BRAND_COPY = {
  tagline: 'Biomedicínske supplementy · Stredná Európa',
  footerBlurb:
    'Moderná, prémiová a dôveryhodná značka pre zdravie, doplnky výživy a zdravotné produkty.',
  heroEyebrow: 'Overené biomedicínske doplnky stravy',
  heroTitle: 'Prirodzená podpora zdravia pre váš každodenný život',
  heroSubtitle:
    'Vyberte si z ponuky overených produktov s dôrazom na kvalitu, prehľadné zloženie a rýchle doručenie.',
  heroSubtitleShort: 'Overené produkty, rýchle doručenie, odborné poradenstvo.',
  heroCta: 'Preskúmať produkty',
  featuredHeading: 'Najpredávanejšie produkty',
  valueProps: ['DÔVERYHODNOSŤ', 'KVALITA', 'RAST', 'PODPORA'] as const,
  logoParts: ['Grow', 'Medica', '.cz'] as const,
  themeColor: '#35C79A',
  siteName: 'GrowMedica.cz',
  siteTitle: 'GrowMedica.cz — biomedicínske supplementy',
  siteDescription:
    'GrowMedica.cz — overené biomedicínske doplnky stravy pre zdravie a vitalitu. Rýchle doručenie a odborné poradenstvo.',
  aboutLabel: 'Prečo GrowMedica',
  aboutHeading: 'Rast, príroda a odborná precíznosť v jednom e-shope',
  aboutBody:
    'GrowMedica.cz spája odbornú precíznosť s prírodnou rovnováhou — overené produkty, dôveryhodný nákup a rastúca komunita spokojných zákazníkov.',
  aboutSlogan: 'Zdravie, ktoré rastie s vami.',
  aboutHealthLines: [
    'Overené zloženie — bez zbytočných prídavných látok',
    'Odborná precíznosť pri výbere každého produktu',
    '460+ doplnkov pre imunitu, pohyb, spánok aj krásu',
    'Rýchle doručenie a produktové poradenstvo online',
    'Balíčky zdravia za zvýhodnené ceny',
  ] as const,
  bundlesHeading: 'Balíčky zdravia',
  bundlesSubheading: 'Overené kombinácie produktov za zvýhodnené ceny',
  bundlesCta: 'Preskúmať balíčky',
  bundlesViewAll: 'Všetky balíčky',
  companyName: 'GrowMedica.cz',
  aboutPageTitle: 'O spoločnosti GrowMedica.cz',
  aboutPageIntro:
    'Sme tím, ktorý verí v silu prirodzených biomedicínskych supplementov podložených skutočnou vedou a rastúcou komunitou v strednej Európe.',
  trustStripStats: ['460+ produktov', 'Stredná Európa', 'Biomedicínske supplementy'] as const,
  pageDescriptions: {
    about:
      'Zistite viac o poslaní, hodnotách a prístupe GrowMedica.cz k prirodzeným biomedicínskym supplementom.',
    blog:
      'Články o zdraví, výžive a prírodných riešeniach od tímu GrowMedica.cz.',
    products:
      'Preskúmajte celý sortiment prirodzených biomedicínskych supplementov GrowMedica.cz.',
    search: 'Vyhľadajte biomedicínske supplementy v GrowMedica.cz.',
    collections:
      'Prehliadajte kategórie produktov. Vyberte si biomedicínske supplementy podľa vašich potrieb.',
    bundles:
      'Balíčky zdravia GrowMedica.cz — overené kombinácie doplnkov pre imunitu, spánok, šport, krásu a ďalšie ciele za zvýhodnené ceny.',
    cart: 'Nákupný košík s vybranými biomedicínskymi supplementmi.',
    contact:
      'Kontaktujte nás — GrowMedica s.r.o., Bellova 3455/6, 040 01 Košice - Staré Mesto. IČO: 56 455 143. E-mail: info@growmedica.cz',
  },
} as const

export const BRAND_ASSETS = [
  '/logo.svg',
  '/logo-icon.svg',
  '/logo-dark.svg',
  '/logo-mark.png',
  '/logo-mark.webp',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/manifest.webmanifest',
] as const

export const REQUIRED_CSS_VARS = [
  '--color-primary',
  '--color-primary-bright',
  '--color-primary-light',
  '--color-text',
  '--color-footer-bg',
] as const
