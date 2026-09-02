import { postcodeLookup } from '~/src/routes/postcode-lookup-receiver.js'

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

describe('postcode lookup receiver route', () => {
  test('GET renders the receiver page with query parameters', () => {
    const query = { postcode: 'NW1 6XE', uprn: '123' }
    const view = jest.fn()

    invokeHandler(postcodeLookup[0], { query }, { view })

    expect(view).toHaveBeenCalledWith('postcode-receiver', {
      params: query,
      pageHeading: 'Postcode lookup plugin PoC',
      pageText: 'Click the button to start the journey'
    })
  })
})
