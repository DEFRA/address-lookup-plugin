/* eslint-disable no-console */
export const logger = {
  /** @type {(text: string) => void} */
  info: (text) => console.log(text),
  /** @type {(err: unknown, text: string) => void} */
  error: (err, text) => console.error(err, text)
}
