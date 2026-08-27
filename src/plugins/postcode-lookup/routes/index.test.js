import { StatusCodes } from 'http-status-codes'
import mockJoi from 'joi'

import { getTranslator } from '~/src/plugins/postcode-lookup/i18n/translator.js'
import {
  JOURNEY_BASE_URL,
  steps
} from '~/src/plugins/postcode-lookup/models/index.js'
import {
  dispatch,
  getDispatchTranslator,
  getRoutes,
  getSessionState
} from '~/src/plugins/postcode-lookup/routes/index.js'
import * as service from '~/src/plugins/postcode-lookup/service.js'

jest.mock('~/src/plugins/postcode-lookup/service.js', () => ({
  searchByUPRN: jest.fn()
}))
jest.mock('~/src/plugins/postcode-lookup/utils.js', () => ({
  resolveLanguage: jest.fn().mockReturnValue('en-GB')
}))
jest.mock('~/src/plugins/postcode-lookup/models/index.js', () => {
  return {
    JOURNEY_BASE_URL: '/postcode-lookup',
    steps: { details: 'details', select: 'select', manual: 'manual' },
    stepSchema: mockJoi.string().valid('details', 'select', 'manual').required(),
    createDetailsPayloadSchema: () => mockJoi.object().unknown(true),
    createSelectPayloadSchema: () => mockJoi.object().unknown(true),
    createManualPayloadSchema: () => mockJoi.object().unknown(true),
    detailsViewModel: jest.fn().mockReturnValue({ step: 'details' }),
    manualViewModel: jest.fn().mockReturnValue({ step: 'manual' }),
    selectViewModel: jest.fn().mockResolvedValue({ step: 'select' })
  }
})

const options = {
  ordnanceSurveyApiKey: 'api-key',
  translator: getTranslator('en-GB')
}

const session = {
  initial: {
    metadata: { 'component-id': '123' },
    sourceUrl: '/source',
    foo: 'bar'
  },
  details: { postcodeQuery: 'NW1 6XE', buildingNameQuery: '' }
}

function createRequest(payload = {}, query = {}) {
  return /** @type {PostcodeLookupRequest} */ (
    /** @type {unknown} */ ({
    payload,
    query,
    yar: {
      get: jest.fn().mockReturnValue(session),
      set: jest.fn()
    }
  }))
}

function createToolkit() {
  const response = {}
  const code = jest.fn().mockReturnValue(response)

  return /** @type {ResponseToolkit & { code: jest.Mock }} */ (
    /** @type {unknown} */ ({
    response,
    code,
    view: jest.fn().mockReturnValue(response),
    redirect: jest.fn().mockReturnValue({ code })
  }))
}

/**
 * @param {unknown } route
 * @param {PostcodeLookupRequest} request
 * @param {ReturnType<typeof createToolkit>} toolkit
 */
function invokeHandler(route, request, toolkit) {
  const typedRoute = /** @type {{ handler: (...args: any[]) => unknown }} */ (
    /** @type {unknown} */ (route)
  )
  const handler = typedRoute.handler

  return handler(request, toolkit)
}

describe('postcode-lookup routes', () => {
  describe('getSessionState', () => {
    test('should throw if missing state', () => {
      const mockRequest = /** @type { PostcodeLookupRequest} */ (
        /** @type {any} */
        ({
          yar: {
            get: jest.fn()
          }
        })
      )
      expect(() => getSessionState(mockRequest)).toThrow(
        'No postcode lookup data found for /postcode-lookup'
      )
    })
  })

  describe('getDispatchTranslator', () => {
    test('should return the configured translator', () => {
      const request = createRequest()

      expect(getDispatchTranslator(request, undefined, options)).toBe(
        options.translator
      )
    })

    test('should store a language query before creating a translator', () => {
      const request = createRequest()
      const translator = getDispatchTranslator(request, 'cy', undefined)

      expect(request.yar.set).toHaveBeenCalledWith('language', 'cy')
      expect(translator.language).toBe('en-GB')
    })
  })

  describe('dispatch', () => {
    test('should store initial data and redirect to the journey', () => {
      const request = createRequest()
      const toolkit = createToolkit()

      const result = dispatch(request, toolkit, {
        sourceUrl: '/source',
        step: steps.manual,
        title: 'Postcode lookup'
      })

      expect(request.yar.set).toHaveBeenCalledWith(JOURNEY_BASE_URL, {
        initial: { sourceUrl: '/source', step: steps.manual, title: 'Postcode lookup' },
        details: { postcodeQuery: '', buildingNameQuery: '' }
      })
      expect(toolkit.redirect).toHaveBeenCalledWith(
        `${JOURNEY_BASE_URL}?step=${steps.manual}`
      )
      expect(result).toBe(toolkit.response)
    })
  })

  describe('getRoutes', () => {
    test('should return GET and POST routes', () => {
      expect(getRoutes(options).map((route) => [route.method, route.path])).toEqual([
        ['GET', JOURNEY_BASE_URL],
        ['POST', JOURNEY_BASE_URL]
      ])
    })

    test('GET should render the details step by default', () => {
      const [route] = getRoutes(options)
      const toolkit = createToolkit()

      invokeHandler(route, createRequest(), toolkit)

      expect(toolkit.view).toHaveBeenCalledWith(
        'postcode-lookup/views/postcode-lookup-details',
        { step: steps.details }
      )
    })

    test('GET should render the manual step when requested', () => {
      const [route] = getRoutes(options)
      const toolkit = createToolkit()

      invokeHandler(route, createRequest({}, { step: steps.manual }), toolkit)

      expect(toolkit.view).toHaveBeenCalledWith(
        'postcode-lookup/views/postcode-lookup-details',
        { step: steps.manual }
      )
    })

    test('POST details should save the details and render the select step', async () => {
      const [, route] = getRoutes(options)
      const request = createRequest({
        step: steps.details,
        postcodeQuery: 'NW1 6XE',
        buildingNameQuery: ''
      })
      const toolkit = createToolkit()

      await invokeHandler(route, request, toolkit)

      expect(request.yar.set).toHaveBeenCalledWith(JOURNEY_BASE_URL, session)
      expect(toolkit.view).toHaveBeenCalledWith(
        'postcode-lookup/views/postcode-lookup-details',
        { step: steps.select }
      )
    })

    test('POST select should redirect with the selected address', async () => {
      const [, route] = getRoutes(options)
      jest.mocked(service.searchByUPRN).mockResolvedValueOnce([
        // @ts-expect-error - partial mock of data
        { uprn: '123', postcode: 'NW1 6XE' }
      ])
      const toolkit = createToolkit()

      await invokeHandler(
        route,
        createRequest({ step: steps.select, uprn: '123' }),
        toolkit
      )

      expect(toolkit.redirect).toHaveBeenCalledWith(
        '/postcode-lookup/receiver?metadata=%7B%22component-id%22%3A%22123%22%7D&sourceUrl=%2Fsource&foo=bar&uprn=123&postcode=NW1+6XE'
      )
      expect(toolkit.code).toHaveBeenCalledWith(StatusCodes.SEE_OTHER)
    })

    test('POST manual should redirect with the manually entered address', async () => {
      const [, route] = getRoutes(options)
      const toolkit = createToolkit()

      await invokeHandler(
        route,
        createRequest({
          step: steps.manual,
          addressLine1: '221B Baker Street',
          addressLine2: '',
          town: 'London',
          county: '',
          postcode: 'NW1 6XE'
        }),
        toolkit
      )

      expect(toolkit.redirect).toHaveBeenCalledWith(
        '/postcode-lookup/receiver?metadata=%7B%22component-id%22%3A%22123%22%7D&sourceUrl=%2Fsource&foo=bar&step=manual&addressLine1=221B+Baker+Street&addressLine2=&town=London&county=&postcode=NW1+6XE'
      )
      expect(toolkit.code).toHaveBeenCalledWith(StatusCodes.SEE_OTHER)
    })
  })
})

/**
 * @import { ResponseToolkit } from '@hapi/hapi'
 * @import { PostcodeLookupGetRequest, PostcodeLookupPostRequest, PostcodeLookupRequest } from '~/src/plugins/postcode-lookup/types.js'
 */
