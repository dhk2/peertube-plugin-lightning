const esbuild = require('esbuild')

for (const file of [   'common-client-plugin.js',
'embed-client-plugin.js','video-edit-client-plugin.js' ]) {
  esbuild.build({
    entryPoints: [ 'client/' + file ],
    bundle: true,
    minify: false,
    format: 'esm',
    outfile: 'dist/' + file,
    target: [ 'safari11' ],
  })
}
