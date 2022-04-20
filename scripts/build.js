const path = require('path')
const esbuild = require('esbuild')

const clientFiles = [
  'common-client-plugin.js'
]

const configs = clientFiles.map(f => ({
  entryPoints: [ path.resolve(__dirname, '..', 'client', f) ],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'safari11',
  outfile: path.resolve(__dirname, '..', 'dist', f),
}))

const promises = configs.map(c => esbuild.build(c))

Promise.all(promises)
  .catch(() => process.exit(1))
