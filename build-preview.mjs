import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const read=name=>readFile(new URL('./dist/'+name,import.meta.url),'utf8');
const [html,css,bundle]=await Promise.all([
  read('index.html'),
  read('style.css'),
  build({
    entryPoints:[fileURLToPath(new URL('./dist/app.mjs',import.meta.url))],
    bundle:true,
    format:'iife',
    platform:'browser',
    target:'es2022',
    sourcemap:'inline',
    legalComments:'inline',
    write:false,
  }),
]);
const script=bundle.outputFiles[0].text.replaceAll('</script','<\\/script');
const styleTag='<link rel="stylesheet" href="./style.css">';
const scriptTag='<script type="module" src="./app.mjs"></script>';
if(!html.includes(styleTag)||!html.includes(scriptTag))throw new Error('dist/index.html is missing the expected style or module entry tag.');
const output=html
  .replace(styleTag,'<style>'+css+'</style>')
  .replace(scriptTag,'<script>'+script+'</script>');
await writeFile(new URL('./preview.html',import.meta.url),output);
console.log('Created preview.html with esbuild — standalone, no network or server required.');
