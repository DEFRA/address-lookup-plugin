import { getTraceId } from '@defra/hapi-tracing'

import { config } from '~/src/config/index.js'

/**
 * Returns the saved language, or the default if none is saved yet
 * @param {Record<string, string>} query
 * @param { Yar | undefined } yar
 * @returns {string}
 */
export function resolveLanguage(query, yar) {
  const defaultLang = 'en-GB'

  if (yar && 'language' in query) {
    yar.set('language', query.language)
  }

  return yar?.get('language') ?? defaultLang
}

/**
 * Safely extracts error message from unknown error types
 * @param {unknown} error - The error to extract message from
 * @returns {string} The error message
 */
export function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Returns a set of headers to use in an HTTP request, merging them with any existing headers in options.
 * @param {Record<string, string> | undefined} [existingHeaders] - Optional existing headers to merge with the tracing headers.
 * @param {string} [header] - The tracing header name to use.
 * @returns {Record<string, string> | undefined} The merged headers, or undefined if no tracing header is available.
 */
export function applyTraceHeaders(
  existingHeaders,
  header = config.get('tracing').header
) {
  if (!header) {
    return existingHeaders
  }

  const traceId = getTraceId()

  const headers = traceId ? { [header]: traceId } : undefined

  return existingHeaders ? Object.assign(existingHeaders, headers) : headers
}

/**
 * @import { Yar } from '@hapi/yar'
 */
