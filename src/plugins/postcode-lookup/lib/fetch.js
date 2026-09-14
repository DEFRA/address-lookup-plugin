import Boom from '@hapi/boom'
import Wreck from '@hapi/wreck'
import { StatusCodes } from 'http-status-codes'

/**
 * @template {object} [BodyType=Buffer]
 * @param {string} method
 * @param {URL} url
 * @param {Parameters<typeof Wreck.request>[2]} options
 */
export async function request(method, url, options) {
  const response = await Wreck.request(method, url.href, options)

  /** @type {BodyType} */
  const body = await Wreck.read(response, options)

  if (response.statusCode !== StatusCodes.OK) {
    const statusCode = response.statusCode
    let err
    const errorBody = /** @type {unknown} */ (body)

    if (
      errorBody &&
      typeof errorBody === 'object' &&
      'message' in errorBody &&
      typeof errorBody.message === 'string' &&
      errorBody.message
    ) {
      const cause = 'cause' in errorBody ? errorBody.cause : undefined
      err = new Error(errorBody.message, { cause })
    } else {
      err = new Error(`HTTP status code ${statusCode}`)
    }

    throw Boom.boomify(err, { statusCode, data: body })
  }

  return { response, body }
}

/**
 * @template {object} [BodyType=Buffer]
 * @param {URL} url
 * @param {Parameters<typeof Wreck.get>[1]} options
 */
export function get(url, options) {
  const requestByType = /** @type {typeof request<BodyType>} */ (request)
  return requestByType('get', url, options)
}

/**
 * @template {object} [BodyType=Buffer]
 * @param {URL} url
 * @param {Parameters<typeof Wreck.get>[1]} options
 */
export function getJson(url, options = {}) {
  const getByType = /** @type {typeof get<BodyType>} */ (get)
  return getByType(url, { json: true, ...options })
}
