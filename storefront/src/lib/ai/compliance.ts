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
  'Toto nie je lekárska rada. Pri zdravotných ťažkostiach sa poraďte s lekárom alebo lekárnikom.'
