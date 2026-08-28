import {
  getTranslator,
  i18nT,
  t
} from '~/src/plugins/postcode-lookup/i18n/translator.js'

describe('translator', () => {
  describe('i18nT', () => {
    test('returns a translated top-level value', () => {
      expect(i18nT('common.or', 'en-GB')).toBe('or')
      expect(i18nT('common.or', 'cy')).toBe('neu')
    })

    test('returns a translated nested value', () => {
      expect(i18nT('postcodeLookup.validation.requiredPostcode', 'en-GB')).toBe(
        'Enter a postcode'
      )
      expect(i18nT('postcodeLookup.validation.requiredPostcode', 'cy')).toBe(
        'Nodwch god post'
      )
    })
  })

  describe('t', () => {
    test('uses singular and plural English translations', () => {
      expect(t('postcodeLookup.addressFound', { count: 1 }, 'en-GB')).toBe(
        '1 address found for'
      )
      expect(t('postcodeLookup.addressFound', { count: 2 }, 'en-GB')).toBe(
        '2 addresses found for'
      )
    })

    test.each([
      [0, 'zero', 'Ni chanfuwyd unrhyw gyfeiriadau ar gyfer'],
      [1, 'one', 'Canfuwyd 1 cyfeiriad ar gyfer'],
      [2, 'two', 'Canfuwyd dau gyfeiriad ar gyfer'],
      [3, 'other', 'Canfuwyd 3 cyfeiriad ar gyfer']
    ])(
      'uses the Welsh %s plural form for count %s',
      (count, _suffix, expected) => {
        expect(t('postcodeLookup.addressFound', { count }, 'cy')).toBe(expected)
      }
    )
  })

  describe('getTranslator', () => {
    test('returns a translator for the requested language', () => {
      const translator = getTranslator('cy')

      expect(translator.language).toBe('cy')
      expect(translator.t('common.and')).toBe('a')
    })

    test('falls back to English when no language is supplied', () => {
      const translator = getTranslator('')

      expect(translator.language).toBe('')
      expect(translator.t('common.and')).toBe('and')
    })
  })
})
