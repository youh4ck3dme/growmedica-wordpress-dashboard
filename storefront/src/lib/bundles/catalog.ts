import type { MainCategory } from '@/lib/category-map'

export const BUNDLE_SHOPIFY_TAG = 'balicek-zdravia'

export type BundleSize = 'mini' | 'standard' | 'plus' | 'premium'

export interface HealthBundle {
  id: number
  slug: string
  name: string
  /** Target category for merchandising */
  category: MainCategory | 'sezonne'
  items: readonly string[]
  discountPercent: number
  size: BundleSize
  /** Optional compliance note */
  disclaimer?: string
}

function bundle(
  id: number,
  slug: string,
  name: string,
  category: HealthBundle['category'],
  items: readonly string[],
  discountPercent: number,
  size: BundleSize,
  disclaimer?: string,
): HealthBundle {
  return { id, slug, name, category, items, discountPercent, size, disclaimer }
}

/** 63 curated health bundles — map items to real Shopify SKUs in Admin */
export const HEALTH_BUNDLE_CATALOG: readonly HealthBundle[] = [
  // Imunita (5)
  bundle(1, 'imunitny-stit-basic', 'Imunitný Štít Basic', 'imunita', ['Vitamín C 1000 mg', 'Vitamín D3 2000 IU', 'Zinok'], 10, 'standard'),
  bundle(2, 'imunitny-stit-plus', 'Imunitný Štít Plus', 'imunita', ['Vitamín C 1000 mg', 'Vitamín D3 2000 IU', 'Zinok', 'Selén', 'Probiotiká'], 12, 'plus'),
  bundle(3, 'imunita-jesen-zima', 'Imunita na jeseň/zimu', 'imunita', ['Vitamín C', 'Vitamín D3', 'Echinacea', 'Beta-glukán'], 12, 'plus'),
  bundle(4, 'rodinna-imunita', 'Rodinná imunita', 'imunita', ['Detský multivitamín', 'Multivitamín pre dospelých', 'Vitamín D3'], 15, 'plus'),
  bundle(5, 'imunita-energia', 'Imunita & energia', 'imunita', ['Vitamín C', 'Cordyceps', 'CoQ10'], 12, 'standard'),

  // Spánok a stres (5)
  bundle(6, 'pokojny-vecer', 'Pokojný večer', 'spanok-stres', ['Magnézium', 'L-theanín', 'Melatonín'], 10, 'standard'),
  bundle(7, 'anti-stres-den', 'Anti-stres deň', 'spanok-stres', ['Ashwagandha', 'B-komplex', 'Magnézium'], 12, 'standard'),
  bundle(8, 'hlboky-spanok', 'Hlboký spánok', 'spanok-stres', ['Melatonín', 'Valeriana', 'Magnézium glycinát'], 12, 'standard'),
  bundle(9, 'office-relax', 'Office relax', 'spanok-stres', ['Ashwagandha', 'Omega-3', 'Vitamín B12'], 12, 'standard'),
  bundle(10, 'spanok-krasa', 'Spánok & krása', 'spanok-stres', ['Magnézium', 'Kolagén', 'Hyaluron'], 15, 'plus'),

  // Športová výživa + regenerácia (8)
  bundle(11, 'starter-fitness', 'Štartér fitness', 'sportova-vyziva', ['Whey proteín', 'BCAA', 'Multivitamín'], 12, 'standard'),
  bundle(12, 'silovy-trenink', 'Silový tréning', 'sportova-vyziva', ['Kreatín', 'Whey proteín', 'Beta-alanín'], 12, 'standard'),
  bundle(13, 'vytrvalost', 'Vytrvalosť', 'sportova-vyziva', ['Izotonický nápoj', 'BCAA', 'Elektrolyty'], 10, 'standard'),
  bundle(14, 'regeneracia-po-treninku', 'Regenerácia po tréningu', 'regeneracia', ['Proteín', 'Magnézium', 'Omega-3'], 12, 'standard'),
  bundle(15, 'bezecky-balicek', 'Bežecký balíček', 'sportova-vyziva', ['Elektrolyty', 'Kolagén typ II', 'Vitamín C'], 12, 'standard'),
  bundle(16, 'crossfit-power', 'CrossFit power', 'sportova-vyziva', ['Kreatín', 'BCAA', 'Zinok'], 12, 'standard'),
  bundle(17, 'ranny-energizer', 'Ranný energizer', 'regeneracia', ['Cordyceps', 'Kofeín', 'B-komplex'], 10, 'standard'),
  bundle(18, 'vecerna-regeneracia', 'Večerná regenerácia', 'regeneracia', ['Proteín', 'ZMA', 'Omega-3'], 15, 'plus'),

  // Kĺby a pohyb (4)
  bundle(19, 'klby-basic', 'Kĺby Basic', 'klby-pohyb', ['Glukosamín', 'Chondroitín', 'MSM'], 10, 'standard'),
  bundle(20, 'klby-active', 'Kĺby Active', 'klby-pohyb', ['Glukosamín', 'Chondroitín', 'MSM', 'Kolagén typ II', 'Vitamín C'], 15, 'plus'),
  bundle(21, 'turistika-pohyb', 'Turistika & pohyb', 'klby-pohyb', ['Kolagén', 'Magnézium', 'Omega-3'], 12, 'standard'),
  bundle(22, 'senior-pohyb', 'Senior pohyb', 'klby-pohyb', ['Glukosamín', 'Vitamín D3', 'Omega-3'], 12, 'standard'),

  // Srdce a cievy (4)
  bundle(23, 'srdce-basic', 'Srdce Basic', 'srdce-cievy', ['Omega-3', 'CoQ10'], 10, 'mini'),
  bundle(24, 'srdce-plus', 'Srdce Plus', 'srdce-cievy', ['Omega-3', 'CoQ10', 'Magnézium', 'Vitamín E'], 12, 'plus'),
  bundle(25, 'cholesterol-balance', 'Cholesterol balance', 'srdce-cievy', ['Omega-3', 'Rýžový olej', 'Vitamín E'], 12, 'standard'),
  bundle(26, 'krvny-obeh', 'Krvný obeh', 'srdce-cievy', ['Ginkgo biloba', 'Omega-3', 'Vitamín B6'], 12, 'standard'),

  // Trávenie (4)
  bundle(27, 'crevna-rovnovaha', 'Črevná rovnováha', 'travenie', ['Probiotiká 10 mld', 'Inulín'], 10, 'mini'),
  bundle(28, 'travenie-komfort', 'Trávenie komfort', 'travenie', ['Tráviace enzýmy', 'Probiotiká', 'Fenikel'], 12, 'standard'),
  bundle(29, 'detox-criev-jemne', 'Detox čriev jemne', 'travenie', ['Probiotiká', 'Psyllium', 'Aktivované uhlie'], 12, 'standard'),
  bundle(30, 'po-antibiotikach', 'Po antibiotikách', 'travenie', ['Probiotiká vysoká dávka', 'Prebiotiká'], 15, 'mini'),

  // Detox a pečeň (4)
  bundle(31, 'pecen-basic', 'Pečeň Basic', 'detox-pecen', ['Ostropestrec', 'Artičok'], 10, 'mini'),
  bundle(32, 'jarny-detox', 'Jarný detox', 'detox-pecen', ['Ostropestrec', 'Chlorophyll', 'Zelený čaj'], 12, 'standard'),
  bundle(33, 'pecen-travenie', 'Pečeň & trávenie', 'detox-pecen', ['Ostropestrec', 'Probiotiká', 'Tráviace enzýmy'], 12, 'standard'),
  bundle(34, 'celotelovy-detox', 'Celotelový detox', 'detox-pecen', ['Chlorophyll', 'Spirulina', 'Ostropestrec'], 15, 'standard'),

  // Krása a pokožka (5)
  bundle(35, 'krasa-zvnutra', 'Krása zvnútra', 'krasa-pokozka', ['Kolagén', 'Biotín', 'Vitamín C'], 12, 'standard'),
  bundle(36, 'vlasy-nechty', 'Vlasy & nechty', 'krasa-pokozka', ['Biotín', 'Zinok', 'Selén'], 10, 'standard'),
  bundle(37, 'hydratacia-pleti', 'Hydratácia pleti', 'krasa-pokozka', ['Hyaluron', 'Omega-3', 'Vitamín E'], 12, 'standard'),
  bundle(38, 'anti-age', 'Anti-age', 'krasa-pokozka', ['Kolagén', 'CoQ10', 'Resveratrol'], 15, 'standard'),
  bundle(39, 'letna-ochrana', 'Letná ochrana', 'krasa-pokozka', ['Vitamín E', 'Beta-karotén', 'Hyaluron'], 12, 'standard'),

  // Vitamíny a minerály (5)
  bundle(40, 'denny-zaklad', 'Denný základ', 'vitaminy-mineraly', ['Multivitamín', 'Omega-3', 'Vitamín D3'], 12, 'standard'),
  bundle(41, 'zelezo-energia', 'Železo & energia', 'vitaminy-mineraly', ['Železo', 'Vitamín C', 'Vitamín B12'], 10, 'standard'),
  bundle(42, 'kosti-zuby', 'Kosti & zuby', 'vitaminy-mineraly', ['Vitamín D3', 'Vitamín K2', 'Vápnik'], 12, 'standard'),
  bundle(43, 'mineralny-komplex', 'Minerálny komplex', 'vitaminy-mineraly', ['Horčík', 'Zinok', 'Selén'], 10, 'standard'),
  bundle(44, 'vegan-essentials', 'Vegan essentials', 'vitaminy-mineraly', ['Vitamín B12', 'Vitamín D3', 'Omega-3 rastlinný'], 12, 'standard'),

  // Proteíny + aminokyseliny (4)
  bundle(45, 'rast-svalov', 'Rast svalov', 'proteiny', ['Whey proteín', 'Kreatín', 'L-glutamín'], 12, 'standard'),
  bundle(46, 'rastlinny-protein', 'Rastlinný proteín', 'proteiny', ['Rastlinný proteín', 'BCAA', 'Vitamín B12'], 12, 'standard'),
  bundle(47, 'bcaa-stack', 'BCAA stack', 'aminokyseliny', ['BCAA', 'L-glutamín', 'Elektrolyty'], 10, 'standard'),
  bundle(48, 'hubnutie-svaly', 'Hubnutie & svaly', 'proteiny', ['Proteín', 'L-karnitín', 'Zelený čaj'], 12, 'standard'),

  // Špeciálna výživa / mykológia (5)
  bundle(49, 'huby-imunita', 'Huby imunita', 'specialna-vyziva', ['Reishi', 'Cordyceps', 'Vitamín C'], 12, 'standard'),
  bundle(50, 'focus-mozog', 'Focus & mozog', 'specialna-vyziva', ["Lion's Mane", 'Omega-3', 'B-komplex'], 15, 'standard'),
  bundle(51, 'energia-z-prirody', 'Energia z prírody', 'specialna-vyziva', ['Cordyceps', 'Maca', 'Guarana'], 12, 'standard'),
  bundle(52, 'adaptogenny-balicek', 'Adaptogénny balíček', 'specialna-vyziva', ['Ashwagandha', 'Reishi', 'Rhodiola'], 15, 'standard'),
  bundle(53, 'mykomedica-trio', 'MykoMedica trio', 'specialna-vyziva', ['Cordyceps', 'Reishi', "Lion's Mane"], 18, 'standard'),

  // Zdravé potraviny (3)
  bundle(54, 'superfood-ranajky', 'Superfood raňajky', 'zdrave-potraviny', ['Chia semienka', 'Spirulina', 'Matcha'], 10, 'standard'),
  bundle(55, 'smoothie-power', 'Smoothie power', 'zdrave-potraviny', ['Proteín', 'Spirulina', 'Banánový prášok'], 12, 'standard'),
  bundle(56, 'clean-eating', 'Clean eating', 'zdrave-potraviny', ['Quinoa', 'Chia semienka', 'Kokosový olej'], 10, 'standard'),

  // Sezónne & životné situácie (7)
  bundle(57, 'back-to-school', 'Back to school', 'sezonne', ['Multivitamín pre deti', 'Omega-3', 'Vitamín D3'], 12, 'standard'),
  bundle(
    58,
    'tehotenstvo-prep',
    'Tehotenstvo prep',
    'sezonne',
    ['Vitamín D3', 'Omega-3', 'Folát'],
    10,
    'standard',
    'Len po konzultácii s lekárom. Nie je určené na liečbu.',
  ),
  bundle(59, 'senior-vitalita', 'Senior vitalita', 'sezonne', ['Multivitamín 50+', 'Omega-3', 'Vitamín D3'], 12, 'standard'),
  bundle(60, 'muz-40-plus', 'Muž 40+', 'sezonne', ['Multivitamín pre mužov', 'CoQ10', 'Saw palmetto'], 12, 'standard'),
  bundle(61, 'zena-40-plus', 'Žena 40+', 'sezonne', ['Multivitamín pre ženy', 'Kolagén', 'Vitamín D3'], 12, 'standard'),
  bundle(62, 'cestovatel', 'Cestovateľ', 'sezonne', ['Probiotiká', 'Elektrolyty', 'Vitamín C'], 10, 'standard'),
  bundle(
    63,
    'growmedica-komplet',
    'GrowMedica Komplet',
    'vitaminy-mineraly',
    ['Multivitamín', 'Omega-3', 'Vitamín D3', 'Probiotiká', 'Magnézium'],
    20,
    'premium',
  ),
] as const

export function getBundleBySlug(slug: string): HealthBundle | undefined {
  return HEALTH_BUNDLE_CATALOG.find((b) => b.slug === slug)
}

export function getBundlesByCategory(category: HealthBundle['category']): HealthBundle[] {
  return HEALTH_BUNDLE_CATALOG.filter((b) => b.category === category)
}

export function getFeaturedBundles(count = 6): HealthBundle[] {
  return HEALTH_BUNDLE_CATALOG.slice(0, count)
}

/** Suggested Shopify product handle prefix: balicek-{slug} */
export function getBundleProductHandle(slug: string): string {
  return `balicek-${slug}`
}

export const BUNDLE_CATEGORY_LABELS: Record<HealthBundle['category'], string> = {
  imunita: 'Imunita',
  'spanok-stres': 'Spánok a stres',
  'sportova-vyziva': 'Športová výživa',
  regeneracia: 'Regenerácia',
  'klby-pohyb': 'Kĺby a pohyb',
  'srdce-cievy': 'Srdce a cievy',
  travenie: 'Trávenie',
  'detox-pecen': 'Detox a pečeň',
  'krasa-pokozka': 'Krása a pokožka',
  'vitaminy-mineraly': 'Vitamíny a minerály',
  proteiny: 'Proteíny',
  aminokyseliny: 'Aminokyseliny',
  'specialna-vyziva': 'Špeciálna výživa',
  'zdrave-potraviny': 'Zdravé potraviny',
  sezonne: 'Sezónne & životné',
  ostatne: 'Ostatné',
}
