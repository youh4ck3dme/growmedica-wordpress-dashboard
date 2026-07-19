import { NextResponse } from 'next/server'

/** Shared response when a removed/unauthorized dashboard write path is hit. */
export const LEGACY_ADMIN_REMOVED_MESSAGE =
  'Táto endpoint cesta nie je dostupná. Správu objednávok, skladu a produktov rob cez /dashboard panely alebo WordPress admin: https://cms.growmedica.cz/wp-admin'

export function legacyAdminRemovedResponse() {
  return NextResponse.json(
    {
      error: LEGACY_ADMIN_REMOVED_MESSAGE,
      admin: 'https://cms.growmedica.cz/wp-admin',
    },
    { status: 410 },
  )
}
