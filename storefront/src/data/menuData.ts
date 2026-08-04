import { MenuData } from "@/types/menu";

export const menuData: MenuData = {
  topBar: {
    promotions: [
      { id: "1", text: "Balíčky zdravia a akciové ponuky", link: "https://www.growmedica.cz/kategorie/balicky-zdravia" },
      { id: "2", text: "Prírodné produkty & Vitálne huby", link: "https://www.growmedica.cz/kategorie/mykologicke-produkty" }
    ],
    shippingInfo: "Doprava zdarma pri nákupe nad 40,00 €",
    localization: "SK | EUR"
  },

  // Vizuálne zoskupenie kategórií nad hlavným menu — návrh, potvrdiť s ownerom pred finálnym nasadením
  departments: [
    {
      id: "zdravie-vyziva",
      name: "Zdravie & Výživa",
      categoryIds: ["zdravotne-riesenia", "doplnky-vyzivy", "mykologicke-produkty", "zdravie"]
    },
    {
      id: "kozmetika-starostlivost",
      name: "Kozmetika & Starostlivosť",
      categoryIds: ["kozmetika"]
    },
    {
      id: "zvierata-balicky",
      name: "Pre zvieratá & Balíčky",
      categoryIds: ["pre-zvierata", "balicky-zdravia"]
    }
  ],

  // Hlavné kategórie v spodnej navigácii s Mega Menu podkategóriami
  categories: [
    {
      id: "balicky-zdravia",
      name: "BALÍČKY ZDRAVIA",
      slug: "https://www.growmedica.cz/kategorie/balicky-zdravia",
      hasMegaMenu: false
    },
    {
      id: "zdravotne-riesenia",
      name: "ZDRAVOTNÉ RIEŠENIA",
      slug: "https://www.growmedica.cz/kategorie/zdravotne-riesenia",
      hasMegaMenu: true,
      columns: [
        {
          title: "Imunita & Telo",
          items: [
            { name: "IMUNITA", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/imunita" },
            { name: "ALERGIE A EKZÉMY", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/alergie-a-ekzemy" },
            { name: "DETOX", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/detox" },
            { name: "OČI", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/oci" },
            { name: "PRIEDUŠKY A KAŠEĽ", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/priedusky-a-kasel" },
            { name: "NÁDOROVÉ OCHORENIA", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/nadorove-ochorenia" }
          ]
        },
        {
          title: "Psychika & Energia",
          items: [
            { name: "PODPORA PRI STRESE", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/podpora-pri-strese" },
            { name: "SPÁNOK", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/spanok" },
            { name: "MOZOG A PAMÄŤ", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/mozog-a-pamat" },
            { name: "PSYCHICKÉ ZDRAVIE", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/psychicke-zdravie" },
            { name: "FYZICKÁ VÝKONNOSŤ", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/fyzicka-vykonnost" }
          ]
        },
        {
          title: "Orgány & Krása",
          items: [
            { name: "KONTROLA HMOTNOSTI", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/kontrola-hmotnosti" },
            { name: "KRÁSA", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/krasa" },
            { name: "KOSTI, KĹBY A SVALY", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/kosti-klby-a-svaly" },
            { name: "TRÁVENIE", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/travenie" },
            { name: "ŽENSKÉ ZDRAVIE", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/zenske-zdravie" },
            { name: "TEHOTENSTVO A DOJČENIE", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/tehotenstvo-a-dojcenie" },
            { name: "MUŽSKÉ ZDRAVIE", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/muzske-zdravie" },
            { name: "SRDCE A PEČEŇ", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/srdce-a-pecen" },
            { name: "OBLIČKY A MOČOVÉ CESTY", link: "https://www.growmedica.cz/kategorie/zdravotne-riesenia/oblicky-a-mocove-cesty" }
          ]
        }
      ]
    },
    {
      id: "mykologicke-produkty",
      name: "MYKOLOGICKÉ PRODUKTY",
      slug: "https://www.growmedica.cz/kategorie/mykologicke-produkty",
      hasMegaMenu: true,
      columns: [
        {
          title: "VITÁLNE HUBY",
          href: "https://www.growmedica.cz/kategorie/mykologicke-produkty/vitalne-huby",
          items: [
            { name: "REISHI", link: "https://www.growmedica.cz/kategorie/mykologicke-produkty/vitalne-huby/reishi" },
            { name: "CORDYCEPS", link: "https://www.growmedica.cz/kategorie/mykologicke-produkty/vitalne-huby/cordyceps" },
            { name: "CORIOLUS", link: "https://www.growmedica.cz/kategorie/mykologicke-produkty/vitalne-huby/coriolus" },
            { name: "CHAGA", link: "https://www.growmedica.cz/kategorie/mykologicke-produkty/vitalne-huby/chaga" },
            { name: "MAITAKE", link: "https://www.growmedica.cz/kategorie/mykologicke-produkty/vitalne-huby/maitake" },
            { name: "HERICIUM", link: "https://www.growmedica.cz/kategorie/mykologicke-produkty/vitalne-huby/hericium" },
            { name: "SHIITAKE", link: "https://www.growmedica.cz/kategorie/mykologicke-produkty/vitalne-huby/shiitake" },
            { name: "OSTATNÉ VITÁLNE HUBY", link: "https://www.growmedica.cz/kategorie/mykologicke-produkty/vitalne-huby/ostatne-vitalne-huby" }
          ]
        },
        {
          title: "VITÁLNE HUBY A BYLINY",
          href: "https://www.growmedica.cz/kategorie/mykologicke-produkty/vitalne-huby-a-byliny",
          items: [
            { name: "HUBY A BYLINKY", link: "https://www.growmedica.cz/kategorie/mykologicke-produkty/vitalne-huby-a-byliny/huby-a-bylinky" },
            { name: "SUŠENÉ HUBY A BYLINY", link: "https://www.growmedica.cz/kategorie/mykologicke-produkty/vitalne-huby-a-byliny/susene-huby-a-byliny" },
            { name: "HUBY V PRÁŠKU", link: "https://www.growmedica.cz/kategorie/mykologicke-produkty/vitalne-huby-a-byliny/huby-v-prasku" },
            { name: "HUBOVÉ MEDY", link: "https://www.growmedica.cz/kategorie/mykologicke-produkty/vitalne-huby-a-byliny/hubove-medy" },
            { name: "TINKTÚRY", link: "https://www.growmedica.cz/kategorie/mykologicke-produkty/vitalne-huby-a-byliny/tinktury" }
          ]
        }
      ]
    },
    {
      id: "doplnky-vyzivy",
      name: "DOPLNKY VÝŽIVY",
      slug: "https://www.growmedica.cz/kategorie/doplnky-vyzivy",
      hasMegaMenu: true,
      columns: [
        {
          title: "Vitamíny & Minerály",
          items: [
            { name: "MULTIVITAMÍNY", link: "https://www.growmedica.cz/kategorie/doplnky-vyzivy/vitaminy/multivitaminy" },
            { name: "VITAMÍN A", link: "https://www.growmedica.cz/kategorie/doplnky-vyzivy/vitaminy/vitamin-a" },
            { name: "VITAMÍN B", link: "https://www.growmedica.cz/kategorie/doplnky-vyzivy/vitaminy/vitamin-b" },
            { name: "VITAMÍN C", link: "https://www.growmedica.cz/kategorie/doplnky-vyzivy/vitaminy/vitamin-c" },
            { name: "VITAMÍN D", link: "https://www.growmedica.cz/kategorie/doplnky-vyzivy/vitaminy/vitamin-d" },
            { name: "HORČÍK – MAGNÉZIUM", link: "https://www.growmedica.cz/kategorie/doplnky-vyzivy/mineraly/horcik-magnezium" },
            { name: "VÁPNIK", link: "https://www.growmedica.cz/kategorie/doplnky-vyzivy/mineraly/vapnik" },
            { name: "ZINOK", link: "https://www.growmedica.cz/kategorie/doplnky-vyzivy/mineraly/zinok" }
          ]
        },
        {
          title: "Trávenie & Kolagén & Byliny",
          items: [
            { name: "PROBIOTIKÁ A PREBIOTIKÁ", link: "https://www.growmedica.cz/kategorie/doplnky-vyzivy/travenie-a-mikrobiom/probiotika-a-prebiotika" },
            { name: "TRÁVIACE ENZÝMY", link: "https://www.growmedica.cz/kategorie/doplnky-vyzivy/travenie-a-mikrobiom/traviace-enzymy" },
            { name: "KOLAGÉN PRE KRÁSU", link: "https://www.growmedica.cz/kategorie/doplnky-vyzivy/kolagen-a-pohyb/kolagen-pre-krasu" },
            { name: "KOLAGÉN NA KĹBY", link: "https://www.growmedica.cz/kategorie/doplnky-vyzivy/kolagen-a-pohyb/kolagen-na-klby" },
            { name: "TEKUTÉ OMEGA-3", link: "https://www.growmedica.cz/kategorie/doplnky-vyzivy/omega-3/tekute-omega-3" },
            { name: "OMEGA-3 KAPSULY", link: "https://www.growmedica.cz/kategorie/doplnky-vyzivy/omega-3/omega-3-kapsuly" }
          ]
        },
        {
          title: "Deti & Diéty",
          items: [
            { name: "DOPLNKY VÝŽIVY PRE DETI", link: "https://www.growmedica.cz/kategorie/doplnky-vyzivy/doplnky-vyzivy-pre-deti" },
            { name: "VEGÁNSKE", link: "https://www.growmedica.cz/kategorie/doplnky-vyzivy/diety-a-stravovanie/veganske" },
            { name: "KETO", link: "https://www.growmedica.cz/kategorie/doplnky-vyzivy/diety-a-stravovanie/keto" },
            { name: "BEZ LAKTÓZY", link: "https://www.growmedica.cz/kategorie/doplnky-vyzivy/diety-a-stravovanie/bez-laktozy" }
          ]
        }
      ]
    },
    {
      id: "zdravie",
      name: "ZDRAVIE",
      slug: "https://www.growmedica.cz/kategorie/zdravie",
      hasMegaMenu: true,
      columns: [
        {
          title: "Prírodné Prípravky",
          items: [
            { name: "BIOINFORMAČNÉ PRÍPRAVKY", link: "https://www.growmedica.cz/kategorie/zdravie/prirodne-pripravky/bioinformacne-pripravky" },
            { name: "BIOINFORMAČNÉ KRÉMY", link: "https://www.growmedica.cz/kategorie/zdravie/prirodne-pripravky/bioinformacne-kremy" },
            { name: "HUMÁTOVÉ PRÍPRAVKY", link: "https://www.growmedica.cz/kategorie/zdravie/prirodne-pripravky/humatove-pripravky" },
            { name: "AROMATERAPIA", link: "https://www.growmedica.cz/kategorie/zdravie/ostatne-pripravky/aromaterapia" }
          ]
        },
        {
          title: "Zdravé Potraviny & Nápoje",
          items: [
            { name: "ZELENÉ A SUPERPOTRAVINY", link: "https://www.growmedica.cz/kategorie/zdravie/zdrave-potraviny/zelene-a-superpotraviny" },
            { name: "BYLINNÉ ČAJE", link: "https://www.growmedica.cz/kategorie/zdravie/zdrave-napoje/bylinne-caje" },
            { name: "FUNKČNÉ NÁPOJE", link: "https://www.growmedica.cz/kategorie/zdravie/zdrave-napoje/funkcne-napoje" },
            { name: "MEDY A SLADIDLÁ", link: "https://www.growmedica.cz/kategorie/zdravie/zdrave-potraviny/medy-a-sladidla" }
          ]
        },
        {
          title: "Regenerácia",
          href: "https://www.growmedica.cz/kategorie/zdravie/regeneracne-doplnky",
          items: [
            { name: "REGENERAČNÉ KRÉMY", link: "https://www.growmedica.cz/kategorie/zdravie/regeneracne-doplnky/regeneracne-kremy" },
            { name: "BALZAMY A OLEJE", link: "https://www.growmedica.cz/kategorie/zdravie/regeneracne-doplnky/regeneracne-balzamy-a-oleje" },
            { name: "REGENERAČNÉ GÉLY", link: "https://www.growmedica.cz/kategorie/zdravie/regeneracne-doplnky/regeneracne-gely-a-emulzie" }
          ]
        }
      ]
    },
    {
      id: "kozmetika",
      name: "KOZMETIKA",
      slug: "https://www.growmedica.cz/kategorie/kozmetika",
      hasMegaMenu: true,
      columns: [
        {
          title: "Pleťová Kozmetika",
          href: "https://www.growmedica.cz/kategorie/kozmetika/pletova-kozmetika",
          items: [
            { name: "ODLIČOVANIE A ČISTENIE PLETI", link: "https://www.growmedica.cz/kategorie/kozmetika/pletova-kozmetika/odlicovanie-a-cistenie-pleti" },
            { name: "PLEŤOVÉ SÉRA", link: "https://www.growmedica.cz/kategorie/kozmetika/pletova-kozmetika/pletove-sera" },
            { name: "DENNÉ KRÉMY", link: "https://www.growmedica.cz/kategorie/kozmetika/pletova-kozmetika/denne-kremy" },
            { name: "NOČNÉ KRÉMY", link: "https://www.growmedica.cz/kategorie/kozmetika/pletova-kozmetika/nocne-kremy" }
          ]
        },
        {
          title: "Telová & Vlasová Kozmetika",
          items: [
            { name: "TELOVÉ OLEJE A GÉLY", link: "https://www.growmedica.cz/kategorie/kozmetika/telova-kozmetika/telove-oleje-a-gely" },
            { name: "SPRCHOVÉ GÉLY", link: "https://www.growmedica.cz/kategorie/kozmetika/telova-kozmetika/sprchove-gely" },
            { name: "ŠAMPÓNY", link: "https://www.growmedica.cz/kategorie/kozmetika/vlasova-kozmetika/sampony" },
            { name: "KONDICIONÉRY", link: "https://www.growmedica.cz/kategorie/kozmetika/vlasova-kozmetika/kondicionery" }
          ]
        },
        {
          title: "Zuby & Deti",
          items: [
            { name: "ZUBNÉ PASTY", link: "https://www.growmedica.cz/kategorie/kozmetika/starostlivost-o-zuby/zubne-pasty" },
            { name: "DETSKÁ KOZMETIKA", link: "https://www.growmedica.cz/kategorie/kozmetika/detska-kozmetika" }
          ]
        }
      ]
    },
    {
      id: "pre-zvierata",
      name: "PRE ZVIERATÁ",
      slug: "https://www.growmedica.cz/kategorie/pre-zvierata",
      hasMegaMenu: true,
      columns: [
        {
          title: "Zdravotné Prípravky",
          href: "https://www.growmedica.cz/kategorie/pre-zvierata/zdravotne-pripravky",
          items: [
            { name: "BYLINNÉ KONCENTRÁTY", link: "https://www.growmedica.cz/kategorie/pre-zvierata/zdravotne-pripravky/bylinne-koncentraty" },
            { name: "MYKOLOGICKÉ PRÍPRAVKY", link: "https://www.growmedica.cz/kategorie/pre-zvierata/zdravotne-pripravky/mykologicke-pripravky" },
            { name: "PRÍRODNÉ PRÍPRAVKY", link: "https://www.growmedica.cz/kategorie/pre-zvierata/zdravotne-pripravky/prirodne-pripravky" }
          ]
        },
        {
          title: "Zvieracie Riešenia",
          href: "https://www.growmedica.cz/kategorie/pre-zvierata/zvieracie-riesenia",
          items: [
            { name: "IMUNITA", link: "https://www.growmedica.cz/kategorie/pre-zvierata/zvieracie-riesenia/imunita" },
            { name: "TRÁVENIE", link: "https://www.growmedica.cz/kategorie/pre-zvierata/zvieracie-riesenia/travenie" },
            { name: "POHYBOVÝ APARÁT", link: "https://www.growmedica.cz/kategorie/pre-zvierata/zvieracie-riesenia/pohybovy-aparat" },
            { name: "KOŽA A ALERGIE", link: "https://www.growmedica.cz/kategorie/pre-zvierata/zvieracie-riesenia/koza-a-alergie" }
          ]
        }
      ]
    }
  ],

  // Horné/sekundárne odkazové položky
  secondaryLinks: [
    { id: "kolekcie", name: "Kolekcie", slug: "https://www.growmedica.cz/kolekcie", isDividerBefore: true },
    { id: "balicky", name: "Balíčky", slug: "https://www.growmedica.cz/balicky" },
    { id: "produkty", name: "Produkty", slug: "https://www.growmedica.cz/produkty" },
    { id: "o-nas", name: "O nás", slug: "https://www.growmedica.cz/o-nas" },
    { id: "hladat", name: "Hľadať", slug: "https://www.growmedica.cz/vyhladavanie", isHighlighted: true }
  ]
};
