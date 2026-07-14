#!/usr/bin/env python3
"""Generate category-coverage.json from Shopify export using category-map rules."""

import csv
import json
import sys
import zipfile
from collections import Counter
from datetime import datetime, timezone
from io import TextIOWrapper
from pathlib import Path

csv.field_size_limit(sys.maxsize)

ROOT = Path(__file__).resolve().parents[1]
ZIP_PATH = ROOT.parent / "docs" / "products_export_shopify.zip"
OUT_PATH = ROOT / "tests" / "fixtures" / "category-coverage.json"

# Mirror storefront/src/lib/category-map.ts RESOLVE_ORDER (first match wins)
RESOLVE_ORDER = [
    ("proteiny", [
        ("type", "Proteíny"), ("tag", "Proteíny"), ("tag", "proteiny"),
    ]),
    ("aminokyseliny", [("tag", "Aminokyseliny")]),
    ("sportova-vyziva", [
        ("type", "ŠPORTOVÁ VÝŽIVA"), ("type", "Šport"),
        ("tag", "ŠPORTOVÁ VÝŽIVA"), ("tag", "šport"),
    ]),
    ("regeneracia", [("type", "Regeneračné doplnky"), ("tag", "Regeneračné doplnky")]),
    ("zdrave-potraviny", [("type", "Zdravé potraviny"), ("tag", "Zdravé potraviny")]),
    ("klby-pohyb", [("tag", "kĺby a svaly"), ("tag", "Kĺby"), ("type", "Pohyb")]),
    ("imunita", [("tag", "Imunita"), ("type", "Imunita")]),
    ("travenie", [("tag", "Trávenie")]),
    ("srdce-cievy", [("tag", "Srdce a Pečeň"), ("tag", "Srdce")]),
    ("spanok-stres", [
        ("type", "Stres / Spánok / Nervy"), ("type", "Psychická pohoda"),
        ("tag", "Spánok"), ("tag", "Stres"),
    ]),
    ("detox-pecen", [("tag", "Detox"), ("tag", "Pečeň"), ("type", "Detoxikácia")]),
    ("krasa-pokozka", [
        ("type", "KOZMETIKA"), ("type", "Detská kozmetika"), ("type", "Pokožka"),
        ("tag", "KOZMETIKA"), ("tag", "Krása"),
    ]),
    ("vitaminy-mineraly", [
        ("tag", "Vitamíny"), ("tag", "Minerály"),
        ("type", "Doplnky výživy pre Deti"), ("type", "DOPLNKY VÝŽIVY"),
        ("tag", "DOPLNKY VÝŽIVY"),
    ]),
    ("specialna-vyziva", [
        ("type", "Prírodné prípravky"), ("type", "Bioinformačné prípravky"),
        ("type", "BALÍČKY ZDRAVIA"), ("type", "PRE ZVIERATÁ"),
        ("tag", "ZDRAVOTNÉ RIEŠENIA"), ("tag", "MYKOLOGICKÉ PRODUKTY"),
        ("tag", "Mykologické prípravky"),
    ]),
]

CATEGORY_TITLES = {
    "sportova-vyziva": "Športová výživa",
    "regeneracia": "Regeneračné doplnky",
    "zdrave-potraviny": "Zdravé potraviny",
    "vitaminy-mineraly": "Vitamíny a minerály",
    "klby-pohyb": "Kĺby a pohyb",
    "imunita": "Imunita",
    "travenie": "Trávenie",
    "srdce-cievy": "Srdce a cievy",
    "spanok-stres": "Spánok a stres",
    "krasa-pokozka": "Krása a pokožka",
    "detox-pecen": "Detox a pečeň",
    "proteiny": "Proteíny",
    "aminokyseliny": "Aminokyseliny",
    "specialna-vyziva": "Špeciálna výživa",
    "ostatne": "Ostatné",
}


def rule_matches(product_type: str, tags: list[str], rule) -> bool:
    kind, value = rule
    if kind == "type":
        return product_type == value
    needle = value.strip().lower()
    return needle in {t.strip().lower() for t in tags}


def resolve_category(product_type: str, tags: list[str]) -> str:
    for slug, rules in RESOLVE_ORDER:
        if any(rule_matches(product_type, tags, r) for r in rules):
            return slug
    return "ostatne"


def load_active_products():
    products = {}
    with zipfile.ZipFile(ZIP_PATH) as zf:
        name = zf.namelist()[0]
        with zf.open(name) as f:
            reader = csv.DictReader(TextIOWrapper(f, encoding="utf-8-sig"))
            for row in reader:
                handle = row.get("Handle", "").strip()
                if not handle or handle in products:
                    continue
                if row.get("Status", "").strip() != "active":
                    continue
                tags = [t.strip() for t in row.get("Tags", "").split(",") if t.strip()]
                products[handle] = {
                    "productType": row.get("Type", "").strip(),
                    "tags": tags,
                }
    return products


def main():
    products = load_active_products()
    counts = Counter()
    ostatne_handles = []

    for handle, p in products.items():
        slug = resolve_category(p["productType"], p["tags"])
        counts[slug] += 1
        if slug == "ostatne":
            ostatne_handles.append(handle)

    total = len(products)
    ostatne_count = counts["ostatne"]
    covered = total - ostatne_count
    coverage = round((covered / total) * 100, 1) if total else 0

    fixture = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "docs/products_export_shopify.zip",
        "totalActive": total,
        "coveredCount": covered,
        "ostatneCount": ostatne_count,
        "coveragePercent": coverage,
        "counts": {slug: counts.get(slug, 0) for slug in list(CATEGORY_TITLES.keys())},
        "categories": [
            {
                "slug": slug,
                "title": CATEGORY_TITLES[slug],
                "count": counts.get(slug, 0),
            }
            for slug in CATEGORY_TITLES
            if slug != "ostatne"
        ],
        "ostatneHandles": ostatne_handles[:50],
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(fixture, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"totalActive": total, "coveragePercent": coverage, "ostatneCount": ostatne_count}, indent=2))


if __name__ == "__main__":
    main()
