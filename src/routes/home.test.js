import { dispatch } from '~/src/plugins/postcode-lookup/routes/index.js'
import { home } from '~/src/routes/home.js'

jest.mock('~/src/plugins/postcode-lookup/routes/index.js', () => ({
  dispatch: jest.fn()
}))

/**
 * @param {unknown} route
 * @param {unknown} request
 * @param {unknown} toolkit
 */
function invokeHandler(route, request, toolkit) {
  const typedRoute = /** @type {{ handler: (...args: any[]) => unknown }} */ (
    /** @type {unknown} */ (route)
  )
  return typedRoute.handler(request, toolkit)
}

describe('home routes', () => {
  test('GET renders the home page', () => {
    const view = jest.fn()

    invokeHandler(home[0], {}, { view })

    expect(view).toHaveBeenCalledWith('home', {
      pageHeading: 'Postcode lookup plugin PoC',
      pageText: 'Click the button to start the journey'
    })
  })

  test('POST dispatches the postcode lookup journey', () => {
    const request = { payload: { postcode: 'NW1 6XE' } }
    const toolkit = { redirect: jest.fn() }

    invokeHandler(home[1], request, toolkit)

    expect(dispatch).toHaveBeenCalledWith(request, toolkit, {
      sourceUrl: '/',
      title: 'Postcode lookup',
      metadata: { key1: 'val1' }
    })
  })
})
