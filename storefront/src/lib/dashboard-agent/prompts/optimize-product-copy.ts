import { stripHtml } from '@/lib/dashboard-agent/copyQuality'

export function buildOptimizeProductCopyPrompt(
  product: { title: string; description: string },
  retryIssues?: string[],
): string {
  const plainDescription = stripHtml(product.description).slice(0, 500)

  const retryBlock = retryIssues?.length
    ? `\nPredchádzajúci návrh neprešiel kontrolou. Oprav tieto problémy: ${retryIssues.join('; ')}`
    : ''

  return `Vráť výhradne JSON objekt: {"title":"...","short_description":"..."}

Si copywriter pre GrowMedica (doplnky výživy, e-shop growmedica.cz). Píš po slovensky.

Pravidlá:
- title: 40–70 znakov, jasný názov produktu pre e-shop, bez veľkých písmen celého nadpisu
- short_description: 120–200 znakov, 1–2 vety, informačný tón
- Produkt je výživový doplnok, NIE liek
- Zakázané tvrdenia: liečba, vyliečenie, diagnóza, terapia, 100% účinnosť, nahrádza odborníka, zabráni chorobe
- Neuvádzaj účinky, ktoré nie sú v originálnom popise
- Profesionálny, dôveryhodný tón značky GrowMedica
- Bez anglicizmov, ak nie sú v origináli${retryBlock}

Originálny produkt:
Názov: ${product.title}
Popis: ${plainDescription || '(bez popisu)'}`
}
