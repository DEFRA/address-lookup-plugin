import Joi from 'joi'

import {
  buildErrors,
  createDetailsPayloadSchema,
  createManualPayloadSchema,
  createSelectPayloadSchema,
  getSelectFields
} from '~/src/plugins/postcode-lookup/models/index.js'

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
})

/**
 * @import { Address } from '~/src/plugins/postcode-lookup/types.js'
 */
