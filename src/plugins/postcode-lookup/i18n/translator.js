const translations = /** @type {Record<string, Record<string, unknown>>} */ ({
  'en-GB': {
    common: {
      or: 'or',
      and: 'and'
    },
    errors: {
      title: 'There is a problem'
    },
    postcodeLookup: {
      postcodeLabel: 'Postcode',
      postcodeHint: 'For example, AA3 1AB',
      buildingNameLabel: 'Building name or number (optional)',
      buildingNameHint: 'For example, 15 or Prospect Cottage',
      selectAddress: 'Select an address',
      addressLine1Label: 'Address line 1',
      addressLine2Label: 'Address line 2 (optional)',
      townLabel: 'Town or city',
      countyLabel: 'County (optional)',
      findAddress: 'Find address',
      enterManually: 'enter address manually',
      searchAgain: 'Search again',
      useThisAddress: 'Use this address',
      findAnAddressInstead: 'find an address instead',
      noAddressFoundTitle: 'No address found',
      noAddressFoundBody: 'We could not find an address that matches',
      addressFound_one: '[[count]] address found for',
      addressFound_other: '[[count]] addresses found for',
      validation: {
        invalidPostcode: 'Enter a valid postcode or enter an address manually',
        requiredPostcode: 'Enter a postcode',
        selectAddress: 'Select an address',
        requiredAddressLine1: 'Enter address line 1',
        requiredTown: 'Enter town or city',
        invalidManualPostcode: 'Enter a valid postcode',
        requiredManualPostcode: 'Enter postcode'
      }
    }
  },
  cy: {
    common: {
      or: 'neu',
      and: 'a'
    },
    errors: {
      title: 'Mae problem'
    },
    postcodeLookup: {
      postcodeLabel: 'Cod post',
      postcodeHint: 'Er enghraifft, AA3 1AB',
      buildingNameLabel: 'Enw neu rif yr adeilad (dewisol)',
      buildingNameHint: 'Er enghraifft, 15 neu Bryn Melyn',
      selectAddress: 'Dewiswch gyfeiriad',
      addressLine1Label: 'Llinell cyfeiriad 1',
      addressLine2Label: 'Llinell cyfeiriad 2 (dewisol)',
      townLabel: 'Tref neu ddinas',
      countyLabel: 'Sir (dewisol)',
      findAddress: 'Dod o hyd i gyfeiriad',
      enterManually: 'nodwch gyfeiriad â llaw',
      searchAgain: 'Chwilio eto',
      useThisAddress: "Defnyddio'r cyfeiriad hwn",
      findAnAddressInstead: 'dod o hyd i gyfeiriad yn lle hynny',
      noAddressFoundTitle: 'Ni chanfuwyd cyfeiriad',
      noAddressFoundBody: 'Ni allem ddod o hyd i gyfeiriad cyfatebol',
      addressFound_zero: 'Ni chanfuwyd unrhyw gyfeiriadau ar gyfer',
      addressFound_one: 'Canfuwyd [[count]] cyfeiriad ar gyfer',
      addressFound_two: 'Canfuwyd dau gyfeiriad ar gyfer',
      addressFound_few: 'Canfuwyd [[count]] chyfeiriad ar gyfer',
      addressFound_many: 'Canfuwyd [[count]] o gyfeiriadau ar gyfer',
      addressFound_other: 'Canfuwyd [[count]] cyfeiriad ar gyfer',
      validation: {
        invalidPostcode: 'Nodwch god post dilys neu nodwch gyfeiriad â llaw',
        requiredPostcode: 'Nodwch god post',
        selectAddress: 'Dewiswch gyfeiriad',
        requiredAddressLine1: 'Nodwch linell cyfeiriad 1',
        requiredTown: 'Nodwch dref neu ddinas',
        invalidManualPostcode: 'Nodwch god post dilys',
        requiredManualPostcode: 'Nodwch god post'
      }
    }
  }
})

/**
 * Handle single or multiple message content for Welsh translations
 * @param {number} count
 * @returns {string}
 */
function determineWelshKeySuffix(count) {
  let suffix
  switch (count) {
    case 0:
      suffix = 'zero'
      break
    case 1:
      suffix = 'one'
      break
    case 2:
      suffix = 'two'
      break
    default:
      suffix = 'other'
  }
  return suffix
}

/**
 * Get a translated value by key. Handles nested keys.
 * @param {string} language
 * @param {string} key
 * @param {{ count?: number }} [options]
 * @returns 
 */
function getValueByPath(language, key, options) {
  const obj = translations[language]
  if (options?.count !== undefined) {
    if (language === 'cy') {
      key = `${key}_${determineWelshKeySuffix(options.count)}`
    } else {
      key = options.count === 1 ? `${key}_one` : `${key}_other`
    }
  }
  // @ts-expect-error - dynamic type nesting
  const res = key.split('.').reduce((value, part) => value[part], obj);

  return options?.count !== undefined ? res.replace('[[count]]', options.count.toString()) : res
}

/**
 * Gets a translated string for the given language and key
 * @param {string} key
 * @param {string} language
 * @returns {string}
 */
export const i18nT = (key, language) => {
  return getValueByPath(language, key, undefined) || key
}

/**
 * Gets a translated string for the given language and key - allows 'options' to be passed
 * @param {string} key
 * @param { Record<string, unknown> | undefined } options
 * @param {string} language
 * @returns {string}
 */
export const t = (key, options, language) => {
  return getValueByPath(language, key, options) || key
}

/**
 * Returns a minimal translator
 * @param {string} language
 */
export function getTranslator(language) {
  return /** @type {Translator} */ ({
    t: (key, options) => t(key, options, language || 'en-GB'),
    language
  })
}
/**
 * @import { Translator } from '~/src/plugins/postcode-lookup/types.js'
 */
