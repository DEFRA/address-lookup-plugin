import Joi from 'joi'

import { buildErrors } from '~/src/plugins/postcode-lookup/models/index.js'

describe('model-index', () => {
  it('should handle no errors', () => {
    expect(buildErrors()).toEqual({})
  })

  it('should handle field error', () => {
    expect(
      buildErrors(
        new Joi.ValidationError('test error', [
          {
            message: 'test field error',
            path: ['addressLine1'],
            type: 'error'
          }
        ], {})
      )
    ).toEqual({
      buildingNameQueryError: undefined,
      countyError: undefined,
      errors: [{
        href: '#addressLine1',
        text: 'test field error'
      }],
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
})
