import { dirname, join } from 'node:path'
import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'

import Hapi from '@hapi/hapi'
import Inert from '@hapi/inert'
import Vision from '@hapi/vision'
import Yar from '@hapi/yar'
import Nunjucks from 'nunjucks'
import resolvePkg from 'resolve'

import { applyUrlParam } from '~/src/nunjucks/filters/applyUrlParam.js'
import { frontend } from '~/src/plugins/frontend.js'
import { postcodeLookupPlugin } from '~/src/plugins/postcode-lookup/index.js'
import { home } from '~/src/routes/home.js'
import { postcodeLookup } from '~/src/routes/postcode-lookup-receiver.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const root = __dirname
const viewsPath = path.join(root, 'views')

const govukFrontendPath = dirname(
  resolvePkg.sync('govuk-frontend/package.json')
)

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost'
  })

  await server.register([Inert, Vision])

  await server.register({
    plugin: Yar,
    options: {
      cookieOptions: {
        password: 'ENTER_YOUR_SESSION_COOKIE_PASSWORD_HERE' // Must be > 32 chars
      }
    }
  })

  const nunjucks = Nunjucks.configure(
    [viewsPath, join(govukFrontendPath, 'dist')],
    {
      autoescape: true,
      noCache: true
    }
  )
  nunjucks.addFilter('applyUrlParam', applyUrlParam)

  server.views({
    engines: {
      html: {
        compile: (/** @type {string} */ src) => {
          return (/** @type {object} */ context) =>
            nunjucks.renderString(src, context)
        }
      }
    },
    relativeTo: root,
    path: ['views', 'plugins'],
    isCached: false,
    context: {
      assetPath: '/assets',
      serviceName: 'Test Service',
      pageTitle: 'Frontend example'
    }
  })

  await server.register(frontend)

  const ordnanceSurveyApiKey = process.env.ORDNANCE_SURVEY_API_KEY
  if (ordnanceSurveyApiKey) {
    await server.register({
      plugin: postcodeLookupPlugin,
      options: {
        ordnanceSurveyApiKey
      }
    })
  }

  server.route(home)
  server.route(postcodeLookup)
  await server.start()

  // eslint-disable-next-line no-console
  console.log('Server running on %s', server.info.uri)
}

process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.log(err)
  process.exit(1)
})

init().catch((err) => {
  // eslint-disable-next-line no-console
  console.log(err)
  process.exit(1)
})
