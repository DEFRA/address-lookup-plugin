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
    const expectedTable = [
      [ { text: 'postcode' }, { text: 'NW1 6XE' }],
      [ { text: 'uprn' }, { text: '123' }]
    ]
    const view = jest.fn()

    invokeHandler(postcodeLookup[0], { query }, { view })

    expect(view).toHaveBeenCalledWith('postcode-receiver', {
      paramRows: expectedTable,
      pageHeading: 'Postcode lookup plugin demo',
      pageText: 'The following parameter values were received:'
    })
  })
})
