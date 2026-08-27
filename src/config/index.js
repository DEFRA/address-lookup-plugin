import convict from 'convict'

import 'dotenv/config'

export const config = convict({
  tracing: {
    header: /** @type {SchemaObj<string>} */ ({
      doc: 'Tracing header name',
      format: String,
      default: 'x-cdp-request-id',
      env: 'TRACING_HEADER'
    })
  },

  ordnanceSurveyApiKey: /** @type {SchemaObj<string | undefined>} */ ({
    doc: 'The ordnance survey api key used by the postcode lookup and maps plugin',
    format: String,
    nullable: true,
    default: undefined,
    env: 'ORDNANCE_SURVEY_API_KEY'
  })
})

config.validate({ allowed: 'strict' })

/**
 * @import { SchemaObj } from 'convict'
 */
