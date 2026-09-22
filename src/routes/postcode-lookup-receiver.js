/**
 * @param {RequestQuery} query
 */
function mapRows(query) {
  const rows = []
  for (const [key, value] of Object.entries(query)) {
    rows.push([
      {
        text: key
      },
      {
        text: value
      }
    ])
  }
  return rows
}

/** @satisfies {ServerRoute[]} */
export const postcodeLookup = [
  {
    method: 'GET',
    path: '/postcode-lookup/receiver',
    handler(request, h) {
      return h.view('postcode-receiver', {
        paramRows: mapRows(request.query),
        pageHeading: 'Postcode lookup plugin demo',
        pageText: 'The following parameter values were received:'
      })
    }
  }
]

/**
 * @import { RequestQuery, ServerRoute } from '@hapi/hapi'
 */
