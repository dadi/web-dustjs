<img src="https://dadi.tech/assets/products/dadi-web-full.png" alt="DADI Web" height="65"/>

## Dust.js engine interface

[![npm (scoped)](https://img.shields.io/npm/v/@dadi/web-dustjs.svg?maxAge=10800&style=flat-square)](https://www.npmjs.com/package/@dadi/web-dustjs)
[![coverage](https://img.shields.io/badge/coverage-57%25-red.svg?style=flat?style=flat-square)](https://github.com/dadi/web-dustjs)
[![Build Status](https://travis-ci.org/dadi/web-dustjs.svg?branch=master)](https://travis-ci.org/dadi/web-dustjs)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)

This module allows [Dust.js](http://www.dustjs.com/) templates to be used with [DADI Web](https://github.com/dadi/web).

## Installation

- Add this module as a dependency:

   ```
   npm install @dadi/web-dustjs --save
   ```

- Include it in the `engines` array passed to Web:

   ```npm
   require('@dadi/web')({
     engines: [
       require('@dadi/web-dustjs')
     ]
   })
   ```

## Configuration

The following configuration parameters can be added to the global Web config file, under `engines.dust`.

### `cache`

If `true`, compiled templates are saved to the Dust cache (recommended).

- Format: `Boolean`
- Default: `true`

---

### `debug`

Dust.js debug mode enabled.

- Format: `Boolean`
- Default: `false`

---

### `debugLevel`

The debug level to use. Should be one of `DEBUG`, `INFO`, `WARN` or `ERROR`.

- Format: `String`
- Default: 'WARN'

---

## `whitespace`

Preserve whitespace in the HTML output.

- Format: `Boolean`
- Default: `true`

---

## `clientRender`
      
#### `enabled`
        
If `true`, compiled templates are made available to the client-side.

- Format: `Boolean`
- Default: `false`

#### `format`

Defines whether compiled templates are written to individual JS files ('separate') or combined into a single one ('combined').

- Format: ['separate', 'combined']
- Default: 'separate'

#### `path`

The location where compiled templates should be written to, relative to 'public'. This should be a folder when 'format' is 'separate' and a file when 'combined'.

- Format: `String`
- Default: `'templates'`

#### `whitelist`

When defined, only templates with names matching an entry in whitelist will be made available to the client. Wildcards supported.

- Format: `Array`
- Default: `[]`

---

### `paths`

Paths required by Dust.

- Format: `Object`
- Default:
    ```
    {
      {
        filters: 'workspace/utils/filters',
        helpers: 'workspace/utils/helpers'
      }
    }
    ```

## Helpers

This module automatically includes the official set of [helpers by LinkedIn](https://github.com/linkedin/dustjs-helpers). Other helper modules will need to be required manually, using a loader file placed in the helpers directory defined in config (e.g. `workspace/utils/helpers/loader.js`)

*Example:*

```js
var components = require('@dadi/web').Components
var dust = require('dustjs-linkedin')

// Load common-dustjs-helpers
var commonDustHelpers = require('common-dustjs-helpers')
new commonDustHelpers.CommonDustjsHelpers().export_helpers_to(dust)

// Load the DADI helper pack
require('@dadi/dustjs-helpers')(dust, { components: components })
```
