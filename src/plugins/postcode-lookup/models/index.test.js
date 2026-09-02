import Joi from 'joi'

import { getTranslator } from '~/src/plugins/postcode-lookup/i18n/translator.js'
import {
  buildErrors,
  createDetailsPayloadSchema,
  createManualPayloadSchema,
  createSelectPayloadSchema,
  detailsViewModel,
  getSelectFields,
  manualViewModel,
  selectViewModel
} from '~/src/plugins/postcode-lookup/models/index.js'
import { search } from '~/src/plugins/postcode-lookup/service.js'

jest.mock('~/src/plugins/postcode-lookup/service.js')

describe('model-index', () => {
  it('should handle no errors', () => {
    expect(buildErrors()).toEqual({})
  })

  it('should handle field error', () => {
    expect(
      buildErrors(
        new Joi.ValidationError(
          'test error',
          [
            {
              message: 'test field error',
              path: ['addressLine1'],
              type: 'error'
            }
          ],
          {}
        )
      )
    ).toEqual({
      buildingNameQueryError: undefined,
      countyError: undefined,
      errors: [
        {
          href: '#addressLine1',
          text: 'test field error'
        }
      ],
      line1Error: {
        message: 'test field error',
        path: ['addressLine1'],
        type: 'error'
      },
      line2Error: undefined,
      postcodeError: undefined,
      postcodeQueryError: undefined,
      townError: undefined,
      uprnError: undefined
    })
  })

  it('should create schemas', () => {
    expect(Joi.isSchema(createDetailsPayloadSchema())).toBe(true)
    expect(Joi.isSchema(createSelectPayloadSchema())).toBe(true)
    expect(Joi.isSchema(createManualPayloadSchema())).toBe(true)
  })

  it('should return single address in select view', async () => {
    jest.mocked(search).mockResolvedValueOnce([
      {
        uprn: 'uprn123',
        address: 'address',
        addressLine1: 'line1',
        addressLine2: 'line2',
        town: 'town',
        county: 'county',
        postcode: 'TS1 1TS',
        formatted: 'line1, line2, town, TS1 1TS'
      }
    ])
    const model = await selectViewModel(
      // @ts-expect-error - partial mock of test data
      {
        session: {
          details: {
            postcodeQuery: 'TS1 1TS',
            buildingNameQuery: '5'
          },
          initial: {
            pageTitle: { 'en-GB': 'title1' },
            sourceUrl: '/url1',
            languages: []
          }
        }
      },
      getTranslator('en-GB')
    )
    expect(model.addressCount).toBe(1)
    expect(model.addressesFoundText).toBe('1 address found for')
    expect(model.pageTitle).toBe('title1')
  })

  it('should return fields in manual view', () => {
    const model = manualViewModel(
      // @ts-expect-error - partial mock of test data
      {
        initial: {
          pageTitle: { 'en-GB': 'title1' },
          sourceUrl: '/url1',
          languages: [
            { name: 'English', code: 'en-GB' },
            { name: 'Cymraeg', code: 'cy' }
          ]
        }
      },
      getTranslator('en-GB')
    )
    expect(model.pageTitle).toBe('title1')
    expect(Object.keys(model.fields)).toEqual([
      'addressLine1',
      'addressLine2',
      'town',
      'county',
      'postcode'
    ])
    expect(model.languages).toHaveLength(2)
  })

  it('should return fields in manual view with errors', () => {
    const model = manualViewModel(
      // @ts-expect-error - partial mock of test data
      {
        initial: {
          pageTitle: { 'en-GB': 'title1' },
          sourceUrl: '/url1',
          languages: [
            { name: 'English', code: 'en-GB' },
            { name: 'Cymraeg', code: 'cy' }
          ]
        }
      },
      getTranslator('en-GB'),
      {},
      new Joi.ValidationError(
        'test error',
        [
          {
            message: 'line1 error',
            path: ['addressLine1'],
            type: 'error'
          },
          {
            message: 'line2 error',
            path: ['addressLine2'],
            type: 'error'
          },
          {
            message: 'town error',
            path: ['town'],
            type: 'error'
          },
          {
            message: 'county error',
            path: ['county'],
            type: 'error'
          },
          {
            message: 'postcode error',
            path: ['postcode'],
            type: 'error'
          }
        ],
        undefined
      )
    )
    expect(model.pageTitle).toBe('title1')
    expect(Object.keys(model.fields)).toEqual([
      'addressLine1',
      'addressLine2',
      'town',
      'county',
      'postcode'
    ])
    expect(model.languages).toHaveLength(2)
    expect(model.fields.addressLine1.errorMessage?.text).toBe('line1 error')
    expect(model.fields.addressLine2.errorMessage?.text).toBe('line2 error')
    expect(model.fields.town.errorMessage?.text).toBe('town error')
    expect(model.fields.county.errorMessage?.text).toBe('county error')
    expect(model.fields.postcode.errorMessage?.text).toBe('postcode error')
  })

  it('should return fields in details view', () => {
    const model = detailsViewModel(
      // @ts-expect-error - partial mock of test data
      {
        initial: {
          pageTitle: { 'en-GB': 'title1' },
          sourceUrl: '/url1',
          languages: [
            { name: 'English', code: 'en-GB' },
            { name: 'Cymraeg', code: 'cy' }
          ]
        }
      },
      getTranslator('en-GB')
    )
    expect(model.pageTitle).toBe('title1')
    expect(Object.keys(model.fields)).toEqual([
      'postcodeQuery',
      'buildingNameQuery'
    ])
    expect(model.languages).toHaveLength(2)
  })

  it('should return list of addresses', () => {
    const addresses = /** @type {Address[]} */ ([
      { uprn: 'uprn123', formatted: '1 Test Street, Testington, TS1 1TS' },
      { uprn: 'uprn500', formatted: '50 Test Street, Testington, TS1 1TS' }
    ])
    const details = { postcodeQuery: 'TS1 1TS', buildingNameQuery: '' }
    const res = getSelectFields(
      details,
      true,
      undefined,
      undefined,
      undefined,
      addresses,
      'en-GB'
    )
    expect(res.uprn.items).toEqual([
      { text: 'Select an address', value: '' },
      { text: '1 Test Street, Testington, TS1 1TS', value: 'uprn123' },
      { text: '50 Test Street, Testington, TS1 1TS', value: 'uprn500' }
    ])
  })

  it('should return a hidden UPRN field for a single address', () => {
    const details = { postcodeQuery: 'TS1 1TS', buildingNameQuery: '' }
    const singleAddress = /** @type {Address} */ ({
      uprn: 'uprn123',
      formatted: '1 Test Street, Testington, TS1 1TS'
    })

    const res = getSelectFields(
      details,
      false,
      singleAddress,
      undefined,
      undefined,
      [singleAddress],
      'en-GB'
    )

    expect(res.uprn).toEqual({
      id: 'uprn',
      name: 'uprn',
      label: undefined,
      value: 'uprn123',
      errorMessage: undefined,
      items: undefined,
      type: 'hidden'
    })
  })

  it('should retain an invalid UPRN selection and display its error', () => {
    const details = { postcodeQuery: 'TS1 1TS', buildingNameQuery: '' }
    const uprnError = {
      message: 'Select an address',
      path: ['uprn'],
      type: 'any.required'
    }

    const res = getSelectFields(
      details,
      false,
      undefined,
      { step: 'select', uprn: 'uprn123' },
      uprnError,
      [],
      'en-GB'
    )

    expect(res.uprn).toMatchObject({
      value: 'uprn123',
      errorMessage: { text: 'Select an address' },
      items: undefined,
      type: undefined
    })
  })
})

/**
 * @import { Address } from '~/src/plugins/postcode-lookup/types.js'
 */
