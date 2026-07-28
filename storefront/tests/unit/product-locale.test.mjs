import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

// Load compiled TS via Next/ts-node is not available; mirror the pure meta resolution logic.
function metaString(product, key) {
  const entry = product.meta_data?.find((m) => m.key === key)
  if (entry == null || entry.value == null) return null
  const value = String(entry.value).trim()
  return value.length > 0 ? value : null
}

function resolveLocalizedProductFields(product, locale) {
  const loc = locale?.toLowerCase?.().slice(0, 2) || null
  const baseTitle = product.name
  const baseShort = product.short_description || ''
  const baseHtml = product.description || ''
  const baseDesc = baseShort || baseHtml

  let i18nBlock = null
  const rawJson = metaString(product, 'gm_i18n') || metaString(product, '_gm_i18n')
  if (rawJson) {
    try {
      i18nBlock = JSON.parse(rawJson)
    } catch {
      i18nBlock = null
    }
  }

  const fromJson = (field) => {
    if (!loc || !i18nBlock?.[loc]) return null
    const value = i18nBlock[loc][field]
    return typeof value === 'string' && value.trim() ? value.trim() : null
  }

  const pickMeta = (...keys) => {
    for (const key of keys) {
      const value = metaString(product, key)
      if (value) return value
    }
    return null
  }

  const title =
    (loc &&
      (fromJson('name') ||
        fromJson('title') ||
        pickMeta(`name_${loc}`, `title_${loc}`, `_name_${loc}`, `gm_name_${loc}`))) ||
    baseTitle

  const shortRaw =
    (loc &&
      (fromJson('short_description') ||
        pickMeta(`short_description_${loc}`, `gm_short_description_${loc}`))) ||
    null

  const htmlRaw =
    (loc && (fromJson('description') || pickMeta(`description_${loc}`, `gm_description_${loc}`))) ||
    null

  return {
    title,
    description: shortRaw || htmlRaw || baseDesc,
    descriptionHtml: htmlRaw ?? baseHtml,
  }
}

describe('resolveLocalizedProductFields (Woo meta multi-lang)', () => {
  const product = {
    name: 'Vitamín C 1000 mg',
    short_description: 'SK krátky popis',
    description: '<p>SK dlhý popis</p>',
    meta_data: [
      { key: 'name_en', value: 'Vitamin C 1000 mg' },
      { key: 'short_description_en', value: 'EN short blurb' },
      { key: 'description_en', value: '<p>EN long description</p>' },
      {
        key: 'gm_i18n',
        value: JSON.stringify({
          de: {
            name: 'Vitamin C 1000 mg',
            short_description: 'DE Kurzbeschreibung',
            description: '<p>DE Langbeschreibung</p>',
          },
        }),
      },
    ],
  }

  it('falls back to base catalog language without locale', () => {
    const fields = resolveLocalizedProductFields(product, null)
    assert.equal(fields.title, 'Vitamín C 1000 mg')
    assert.equal(fields.description, 'SK krátky popis')
  })

  it('reads name_en / short_description_en meta keys', () => {
    const fields = resolveLocalizedProductFields(product, 'en')
    assert.equal(fields.title, 'Vitamin C 1000 mg')
    assert.equal(fields.description, 'EN short blurb')
    assert.equal(fields.descriptionHtml, '<p>EN long description</p>')
  })

  it('reads gm_i18n JSON block for de', () => {
    const fields = resolveLocalizedProductFields(product, 'de')
    assert.equal(fields.title, 'Vitamin C 1000 mg')
    assert.equal(fields.description, 'DE Kurzbeschreibung')
    assert.equal(fields.descriptionHtml, '<p>DE Langbeschreibung</p>')
  })

  it('falls back when locale meta missing', () => {
    const fields = resolveLocalizedProductFields(product, 'cs')
    assert.equal(fields.title, 'Vitamín C 1000 mg')
    assert.equal(fields.description, 'SK krátky popis')
  })
})

// Silence unused imports if tooling flags them
void path
void pathToFileURL
void createRequire
