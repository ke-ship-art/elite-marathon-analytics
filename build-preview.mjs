import {readFile,writeFile} from 'node:fs/promises';
const read=name=>readFile(new URL('./dist/'+name,import.meta.url),'utf8');
const [html,css,core,usability,calendar,restored,recovery,londonSplits,splitImport,app]=await Promise.all(['index.html','style.css','core.mjs','usability.mjs','calendar.mjs','restored-workspace.mjs','workspace-recovery.mjs','london-splits.mjs','split-import.mjs','app.mjs'].map(read));
const strip=source=>source.replace(/^import .*?;\r?\n/gm,'').replace(/^export /gm,'');
const script=strip(core)+'\n'+strip(usability)+'\n'+strip(calendar)+'\n'+strip(restored)+'\n'+strip(recovery)+'\n'+strip(londonSplits)+'\n'+strip(splitImport)+'\n'+strip(app);
const output=html.replace('<link rel="stylesheet" href="./style.css">','<style>'+css+'</style>').replace('<script type="module" src="./app.mjs"></script>','<script type="module">'+script.replaceAll('</script','<\\/script')+'</script>');
await writeFile(new URL('./preview.html',import.meta.url),output);
console.log('Created preview.html — standalone, no network or server required.');
