# Address Lookup Plugin

This repository contains a Hapi.js plugin for a GOV.UK-style postcode lookup and address selection journey. It integrates with the Ordnance Survey Places API and returns a selected address back to the calling application via a callback URL.

## What this project does

The app exposes a postcode lookup flow that:

- starts from a page or route that calls the plugin
- lets the user search by postcode and optional building name
- shows a list of matching addresses
- allows selection of one result
- redirects the selected address back to a receiver route or callback URL
- supports both English and Welsh language variants through the built-in translator

This is a plugin (with integrated demo) rather than a standalone customer service application. The core logic lives under `src/plugins/postcode-lookup`.

## Key files

- `src/index.js` – starts the Hapi server and registers the GOV.UK frontend assets, session handling, and postcode lookup plugin
- `src/routes/home.js` – renders the homepage and initialises the postcode lookup journey
- `src/routes/postcode-lookup-receiver.js` – displays the selected address after callback redirect
- `src/plugins/frontend.js` – serves GOV.UK frontend CSS and assets
- `src/plugins/postcode-lookup/index.js` – plugin registration for the postcode lookup journey
- `src/plugins/postcode-lookup/routes/index.js` – core GET/POST route logic for the lookup flow
- `src/plugins/postcode-lookup/service.js` – calls the Ordnance Survey Places API and normalises responses
- `src/plugins/postcode-lookup/models/` – view models and journey state
- `src/plugins/postcode-lookup/i18n/` – language strings and translation logic

## Requirements

- Node.js
- npm
- an Ordnance Survey API key

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file with your API key:

Create a `.env` file in the root of the project.

Then set the value in `.env` or export it in your shell:

```bash
export ORDNANCE_SURVEY_API_KEY="your-api-key"
```

## Running locally

For local development, use the watch script:

```bash
npm run server:watch:dev
```

This starts the Hapi server from `src/index.js` with tsx watching enabled.

You can also run the project in the bundled development mode:

```bash
npm run dev
```

## Building

To compile the app into the generated `.server` output:

```bash
npm run build
```

This creates the compiled server files in `.server/` and also builds the GOV.UK SCSS bundle into `public/build/stylesheets/application.css`.

You can pack the compiled code into a `.tgz` file, and copy it to another codebase area with:
```bash
npm pack
cp defra-address-lookup-plugin-1.0.0.tgz ../<change-to-your-otherrepo-folder>/.
```

Then unpack it locally in the other codebase, using:

```bash
npm install defra-address-lookup-plugin-1.0.0.tgz
```

## Start compiled output

After a successful build, the compiled server may be started from the generated output:

```bash
node .server/index.js
```

## Plugin usage

The postcode lookup plugin is registered when an Ordnance Survey API key is present. It expects a session-backed journey and accepts a start payload similar to:

```js
{
  sourceUrl: '/',
  title: 'Postcode lookup',
  metadata: { 'component-id': '123' },
  step: 'details'
}
```

`metadata` is an optional pass-through property which can hold key/value pairs, and gets added to the model in the callback.

The plugin stores journey state in `yar` and redirects back to the configured callback URL once an address is selected, defaulting to `/postcode-lookup/receiver` when no callback is provided.

## Routes

The demo server includes:

- `/` – homepage rendered by `src/routes/home.js`
- `/postcode-lookup` – lookup journey route
- `/postcode-lookup/receiver` – selected-address confirmation page

## Testing

Run the automated tests with:

```bash
npm test
```

The repo includes unit tests covering the service and route logic, especially around address formatting and redirects.

## Notes

- The GOV.UK frontend assets are served from the `govuk-frontend` package and the compiled stylesheet output in `public/build/stylesheets`.
- The project uses Hapi plugins, session state, and `@hapi/vision`/`@hapi/inert` for rendering and static assets.
