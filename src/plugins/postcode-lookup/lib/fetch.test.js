import Wreck from '@hapi/wreck'
import { StatusCodes } from 'http-status-codes'

import {
  del,
  delJson,
  get,
  getJson,
  patch,
  patchJson,
  post,
  postJson,
  put,
  putJson,
  request
} from '~/src/plugins/postcode-lookup/lib/fetch.js'

const url = new URL('/test', 'https://test.com')
const options = { headers: { Authorization: 'Bearer token' } }
const response = /** @type {IncomingMessage} */ ({
  statusCode: StatusCodes.OK
})
const body = { reference: '1234' }

describe('HTTP service', () => {
  beforeEach(() => {
    jest.spyOn(Wreck, 'request').mockResolvedValue(response)
    jest.spyOn(Wreck, 'read').mockResolvedValue(body)
  })

  describe('request', () => {
    it('sends a request and reads its response', async () => {
      await expect(request('get', url, options)).resolves.toEqual({
        response,
        body
      })

      expect(Wreck.request).toHaveBeenCalledWith('get', url.href, options)
      expect(Wreck.read).toHaveBeenCalledWith(response, options)
    })

    it('throws a Boom error for a non-200 response', async () => {
      const errorBody = { message: 'Not found' }
      jest
        .mocked(Wreck.request)
        .mockResolvedValue(
          /** @type {IncomingMessage} */ ({ statusCode: StatusCodes.NOT_FOUND })
        )
      jest.mocked(Wreck.read).mockResolvedValue(errorBody)

      await expect(request('get', url, options)).rejects.toMatchObject({
        isBoom: true,
        output: { statusCode: StatusCodes.NOT_FOUND },
        data: errorBody
      })
    })

    it('throws an HTTP status error when the response body is empty', async () => {
      jest
        .mocked(Wreck.request)
        .mockResolvedValue(
          /** @type {IncomingMessage} */ ({ statusCode: StatusCodes.NOT_FOUND })
        )
      jest.mocked(Wreck.read).mockResolvedValue(undefined)

      await expect(request('get', url, options)).rejects.toMatchObject({
        isBoom: true,
        message: 'HTTP status code 404',
        output: { statusCode: StatusCodes.NOT_FOUND }
      })
    })
  })

  describe('HTTP method helpers', () => {
    it.each([
      ['get', get],
      ['patch', patch],
      ['post', post],
      ['put', put],
      ['delete', del]
    ])('uses the %s method', async (method, helper) => {
      await expect(helper(url, options)).resolves.toEqual({ response, body })

      expect(Wreck.request).toHaveBeenCalledWith(method, url.href, options)
    })
  })

  describe('JSON helpers', () => {
    it.each([
      ['get', getJson],
      ['patch', patchJson],
      ['post', postJson],
      ['put', putJson],
      ['delete', delJson]
    ])('requests JSON with the %s method', async (method, helper) => {
      await expect(helper(url, options)).resolves.toEqual({ response, body })

      expect(Wreck.request).toHaveBeenCalledWith(method, url.href, {
        ...options,
        json: true
      })
    })

    it('uses JSON by default when no options are supplied', async () => {
      await getJson(url)

      expect(Wreck.request).toHaveBeenCalledWith('get', url.href, {
        json: true
      })
    })
  })

  it('preserves an error cause from the response body', async () => {
    const cause = new Error('cause')
    const errorBody = { message: 'Request failed', cause }
    jest
      .mocked(Wreck.request)
      .mockResolvedValue(
        /** @type {IncomingMessage} */ ({ statusCode: StatusCodes.BAD_REQUEST })
      )
    jest.mocked(Wreck.read).mockResolvedValue(errorBody)

    await expect(request('post', url, options)).rejects.toMatchObject({
      isBoom: true,
      message: 'Request failed',
      data: errorBody,
      cause
    })
  })
})

/**
 * @import { IncomingMessage } from 'node:http'
 */
