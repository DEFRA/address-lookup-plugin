import { getRoutes } from '~/src/plugins/postcode-lookup/routes/index.js'

/**
 * @satisfies {NamedPlugin<PostcodeLookupConfiguration>}
 */
export const postcodeLookupPlugin = {
  name: '@defra/address-lookup-plugin',
  dependencies: ['@hapi/vision', '@hapi/yar'],
  multiple: false,
  register(server, options) {
    // @ts-expect-error - Request typing
    server.route(getRoutes(options))
  }
}

/**
 * @import { NamedPlugin } from '@hapi/hapi'
 * @import { PostcodeLookupConfiguration } from './types.js'
 */
