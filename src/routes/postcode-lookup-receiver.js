/** @satisfies {ServerRoute[]} */
export const postcodeLookup = [
  {
    method: 'GET',
    path: '/postcode-lookup/receiver',
    handler: (request, h) =>
      h.view('postcode-receiver', {
        params: request.query,
        pageHeading: 'Postcode lookup plugin demo',
        pageText: 'Click the button to start the journey'
      })
  }
]

/**
 * @import { ServerRoute } from '@hapi/hapi'
 */
