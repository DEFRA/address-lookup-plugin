'use strict'

import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '../..')
const govukAssetsPath = path.join(
  root,
  'node_modules',
  'govuk-frontend',
  'dist',
  'govuk'
)

export const frontend = {
  name: 'frontend',
  /** @param {Server} server */
  register: function (server) {
    server.route({
      method: 'GET',
      path: '/assets/stylesheets/{path*}',
      handler: {
        directory: {
          path: path.join(root, 'public', 'build', 'stylesheets')
        }
      }
    })

    server.route({
      method: 'GET',
      path: '/assets/{path*}',
      handler: {
        directory: {
          path: govukAssetsPath
        }
      }
    })
  }
}

/**
 * @import { Server } from '@hapi/hapi'
 */
