import Boom from '@hapi/boom'
import { StatusCodes } from 'http-status-codes'
import Joi from 'joi'

import { getTranslator } from '~/src/plugins/postcode-lookup/i18n/translator.js'
import {
  JOURNEY_BASE_URL,
  createDetailsPayloadSchema,
  createManualPayloadSchema,
  createSelectPayloadSchema,
  detailsViewModel,
  manualViewModel,
  selectViewModel,
  stepSchema,
  steps
} from '~/src/plugins/postcode-lookup/models/index.js'
import * as service from '~/src/plugins/postcode-lookup/service.js'
import { resolveLanguage } from '~/src/plugins/postcode-lookup/utils.js'

const viewName = 'postcode-lookup/views/postcode-lookup-details'

const defaultReceiverPath = '/postcode-lookup/receiver'

/**
 * Get the session state associated with this journey
 * @param {PostcodeLookupRequest} request
 */
export function getSessionState(request) {
  /**
   * @type {PostcodeLookupSessionData | null | undefined}
   */
  const state = request.yar.get(JOURNEY_BASE_URL)

  if (!state) {
    throw Boom.badRequest(
      `No postcode lookup data found for ${JOURNEY_BASE_URL}`
    )
  }

  return state
}

/**
 * Get the translator
 * @param {PostcodeLookupRequest} request
 * @param { string | string[] | undefined } language
 * @param { PostcodeLookupConfiguration | undefined } options
 */
export function getDispatchTranslator(request, language, options) {
  if (options?.translator) {
    return options.translator
  }

  // Override language if passed as a query param
  if (language) {
    request.yar.set('language', language)
  }

  const typedReq = /** @type {GenericRequest} */ (/** @type {any} */ (request))
  const lang = resolveLanguage(typedReq.query, typedReq.yar)

  const translator = getTranslator(lang)

  return translator
}

/**
 * Initialises and dispatches the request to the postcode lookup journey
 * @param {PostcodeLookupRequest} request - the hapi request
 * @param {ResponseToolkit} h - the response toolkit
 * @param {PostcodeLookupDispatchData} initial - the source data
 * @returns {ResponseObject}
 */
export function dispatch(request, h, initial) {
  /**
   * @type {PostcodeLookupSessionData}
   */
  const data = {
    initial,
    details: { postcodeQuery: '', buildingNameQuery: '' }
  }

  request.yar.set(JOURNEY_BASE_URL, data)

  const query = initial.step ? `?step=${initial.step}` : ''

  return h.redirect(`${JOURNEY_BASE_URL}${query}`).code(StatusCodes.SEE_OTHER)
}

/**
 * Gets the postcode lookup routes
 * @param {PostcodeLookupConfiguration} options - ordnance survey api key
 */
export function getRoutes(options) {
  return [getRoute(options), postRoute(options)]
}

/**
 * @param {PostcodeLookupConfiguration} options
 * @returns {ServerRoute<PostcodeLookupGetRequestRefs>}
 */
function getRoute(options) {
  return {
    method: 'GET',
    path: JOURNEY_BASE_URL,
    handler(request, h) {
      const { query } = request
      const { step, language } = query
      const session = getSessionState(request)

      const translator = getDispatchTranslator(
        request,
        language,
        options
      )

      const model =
        step === steps.manual
          ? manualViewModel(session, translator)
          : detailsViewModel(session, translator)

      return h.view(viewName, model)
    },
    options: {
      validate: {
        query: Joi.object()
          .keys({
            step: Joi.string().allow(steps.details, steps.manual).optional(),
            language: Joi.string().allow('en-GB', 'cy').optional()
          })
          .optional()
      }
    }
  }
}

/**
 * @param {PostcodeLookupConfiguration} options
 * @returns {ServerRoute<PostcodeLookupPostRequestRefs>}
 */
function postRoute(options) {
  return {
    method: 'POST',
    path: JOURNEY_BASE_URL,
    async handler(request, h) {
      const typedRequest = /** @type {PostcodeLookupPostRequest} */ (
        /** @type {unknown} */ (request)
      )
      const { payload } = typedRequest
      const { step } = payload

      switch (step) {
        case steps.details: {
          return detailsPostHandler(typedRequest, h, options)
        }
        case steps.select: {
          return selectPostHandler(typedRequest, h, options)
        }
        case steps.manual: {
          return manualPostHandler(typedRequest, h, options)
        }
        default:
          throw Boom.badRequest(`Invalid step ${step}`)
      }
    },
    options: {
      validate: {
        payload: Joi.object()
          .keys({
            step: stepSchema
          })
          .unknown(true)
      }
    }
  }
}

/**
 * Post handler for the details step
 * @param {PostcodeLookupPostRequest} request
 * @param {ResponseToolkit<PostcodeLookupPostRequestRefs>} h
 * @param {PostcodeLookupConfiguration} options
 */
async function detailsPostHandler(request, h, options) {
  const session = getSessionState(request)
  const { ordnanceSurveyApiKey: apiKey } = options
  const translator = getDispatchTranslator(
    request,
    request.query.language,
    options
  )
  const language = translator.language

  const { value: details, error } = createDetailsPayloadSchema(
    language
  ).validate(request.payload)

  let model

  if (error) {
    model = detailsViewModel(session, translator, details, error)

    return h.view(viewName, model)
  }

  const { postcodeQuery, buildingNameQuery } = details
  session.details = { postcodeQuery, buildingNameQuery }

  // Store the updated session
  request.yar.set(JOURNEY_BASE_URL, session)

  model = await selectViewModel({ session, apiKey }, translator)

  return h.view(viewName, model)
}

/**
 * Post handler for the select step
 * @param {PostcodeLookupPostRequest} request
 * @param {ResponseToolkit<PostcodeLookupPostRequestRefs>} h
 * @param {PostcodeLookupConfiguration} options
 */
async function selectPostHandler(request, h, options) {
  const session = getSessionState(request)
  const { ordnanceSurveyApiKey: apiKey } = options
  const translator = getDispatchTranslator(
    request,
    request.query.language,
    options
  )
  const language = translator.language
  const { value: select, error } = createSelectPayloadSchema(language).validate(
    request.payload
  )

  if (error) {
    const model = await selectViewModel(
      { session, apiKey },
      translator,
      select,
      error
    )

    return h.view(viewName, model)
  }

  const addresses = await service.searchByUPRN(select.uprn, apiKey)
  const property = addresses.at(0)

  if (!property) {
    throw Boom.internal(`UPRN ${property} not found`)
  }

  const combinedModel = { ...session.initial, ...property }

  // Redirect back to the receiver page, with appropriate params
  const receiverPath = options.callbackUrl ?? defaultReceiverPath
  const returnUrl = new URL(receiverPath, 'https://local')
  for (const [key, val] of Object.entries(combinedModel)) {
    const value =
      typeof val === 'string' ? val : JSON.stringify(val)
    returnUrl.searchParams.append(key, value)
  }
  return h.redirect(`${receiverPath}${returnUrl.search}`).code(StatusCodes.SEE_OTHER)
}

/**
 * Post handler for the manual step
 * @param {PostcodeLookupPostRequest} request
 * @param {ResponseToolkit<PostcodeLookupPostRequestRefs>} h
 * @param {PostcodeLookupConfiguration} options
 */
function manualPostHandler(request, h, options) {
  const session = getSessionState(request)
  const translator = getDispatchTranslator(
    request,
    request.query.language,
    options
  )
  const language = translator.language

  const { value: manual, error } = createManualPayloadSchema(language).validate(
    request.payload,
    {
      abortEarly: false
    }
  )

  if (error) {
    const model = manualViewModel(session, translator, manual, error)

    return h.view(viewName, model)
  }

  const combinedModel = { ...session.initial, ...manual }

  // Redirect back to the receiver page, with appropriate params
  const receiverPath = options.callbackUrl ?? defaultReceiverPath
  const returnUrl = new URL(receiverPath, 'https://local')
  for (const [key, val] of Object.entries(combinedModel)) {
    const value =
      typeof val === 'string' ? val : JSON.stringify(val)
    returnUrl.searchParams.append(key, value)
  }
  return h.redirect(`${receiverPath}${returnUrl.search}`).code(StatusCodes.SEE_OTHER)
}

/**
 * @import { ResponseObject, ResponseToolkit, ServerRoute } from '@hapi/hapi'
 * @import { GenericRequest, PostcodeLookupGetRequestRefs, PostcodeLookupPostRequestRefs, PostcodeLookupRequest, PostcodeLookupPostRequest, PostcodeLookupConfiguration, PostcodeLookupDispatchData, PostcodeLookupSessionData } from '~/src/plugins/postcode-lookup/types.js'
 */
