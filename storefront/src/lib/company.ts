/**
 * GrowMedica s.r.o. — právne a bankové údaje (source of truth v kóde).
 * Zrkadlí docs/vzorfirma.md — pri zmene aktualizovať oboje.
 */

export const COMPANY = {
  legalName: 'GrowMedica s.r.o.',
  street: 'Bellova 3455 / 6',
  /** Woo / formát bez medzier okolo lomítka */
  streetCompact: 'Bellova 3455/6',
  city: 'Košice - Staré Mesto',
  zip: '040 01',
  country: 'Slovenská republika',
  countryCode: 'SK',
  ico: '56 455 143',
  icoDigits: '56455143',
  dic: '2122314975',
  email: 'info@growmedica.cz',
  /** Prázdne = nezobrazovať falošné číslo (doplň reálne a deploy). */
  phoneDisplay: '',
  phoneTel: '',
  iban: 'SK48 0200 0000 0050 3517 2956',
  ibanCompact: 'SK4802000000005035172956',
  bic: 'SUBASKBX',
  bankName: 'VÚB, a.s.',
  website: 'https://www.growmedica.cz',
} as const

/** Viacriadkový blok dodávateľa (faktúra, e-mail, VOP). */
export function formatSupplierBlock(): string {
  return [
    COMPANY.legalName,
    COMPANY.street,
    `${COMPANY.zip} ${COMPANY.city}`,
    COMPANY.country,
    '',
    `IČO: ${COMPANY.ico}`,
    `DIČ: ${COMPANY.dic}`,
  ].join('\n')
}

/** Bankové údaje pre prevod / e-mail. */
export function formatBankBlock(): string {
  return [
    `Číslo účtu: ${COMPANY.iban}`,
    `BIC / SWIFT: ${COMPANY.bic}`,
    `Banka: ${COMPANY.bankName}`,
    `Majiteľ účtu: ${COMPANY.legalName}`,
  ].join('\n')
}

/** Jednoriadok do footera / meta. */
export function formatCompanyOneLine(): string {
  return `${COMPANY.legalName} · ${COMPANY.streetCompact}, ${COMPANY.zip} ${COMPANY.city} · IČO: ${COMPANY.ico} · DIČ: ${COMPANY.dic}`
}

/** Woo e-mail footer (HTML). */
export function formatEmailFooterHtml(): string {
  return [
    COMPANY.legalName,
    `${COMPANY.street}, ${COMPANY.zip} ${COMPANY.city}, ${COMPANY.country}`,
    `IČO: ${COMPANY.ico} · DIČ: ${COMPANY.dic}`,
    `IBAN: ${COMPANY.iban} · BIC: ${COMPANY.bic}`,
    COMPANY.email,
  ].join('<br>')
}
