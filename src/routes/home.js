'use strict'

import { dispatch } from '~/src/plugins/postcode-lookup/routes/index.js'

/** @satisfies {ServerRoute[]} */
export const home = [
  {
    method: 'GET',
    path: '/',
    handler: (request, h) =>
      h.view('home', {
        pageHeading: 'Postcode lookup plugin demo',
        pageText: 'Click the button to start the journey'
      })
  },
  {
    method: 'POST',
    path: '/',
    handler: (request, h) =>
      dispatch(
        /** @type {PostcodeLookupRequest} */ (/** @type {unknown} */ (request)),
        h,
        {
          sourceUrl: '/',
          pageTitle: { 'en-GB': 'Postcode lookup' },
          languages: [
            { code: 'en-GB', name: 'English' },
            { code: 'cy', name: 'Cymraeg' }
          ],
          metadata: { 'key1': 'val1' }
        }
      )
  }
]

/**
 * @import { ServerRoute } from '@hapi/hapi'
 * @import { PostcodeLookupRequest } from '~/src/plugins/postcode-lookup/types.js'
 */
