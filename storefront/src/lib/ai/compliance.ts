const BLOCKED_PATTERNS = [
  /lieč(i|ba|í)/i,
  /vylieč(i|í)/i,
  /diagnóza/i,
  /garancia/i,
  /100[\s%]-?účinn(y|ý|á)/i,
  /zázrak/i,
  /nahraď(te)?\s*(lekár[aá]|doktor[aá])/i,
  /zabráni[ťt]/i,
  /terapia/i,
  /liek/i,
]

/** Overí, či text obsahuje zakázané tvrdenia (len user-facing vstup). */
export function checkCompliance(text: string): string[] {
  const issues: string[] = []
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      issues.push(`Zakázané tvrdenie: ${pattern.source}`)
    }
  }
  return issues
}

export const SAFE_DISCLAIMER =
  'Toto nie je odborná zdravotná rada. Pri zdravotných ťažkostiach sa poraďte s kvalifikovaným odborníkom.'

/** Locale-aware disclaimer for AI UI/API (falls back to SK). */
export function getSafeDisclaimer(locale?: string | null): string {
  switch ((locale ?? 'sk').toLowerCase().slice(0, 2)) {
    case 'cs':
      return 'Toto není odborná zdravotní rada. Při zdravotních potížích se poraďte s kvalifikovaným odborníkem.'
    case 'en':
      return 'This is not professional medical advice. For health concerns, consult a qualified professional.'
    case 'de':
      return 'Dies ist keine medizinische Fachberatung. Bei gesundheitlichen Beschwerden wenden Sie sich an einen qualifizierten Fachmann.'
    default:
      return SAFE_DISCLAIMER
  }
}
