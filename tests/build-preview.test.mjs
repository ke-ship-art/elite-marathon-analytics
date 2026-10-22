import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

test('offline preview is bundled from the module graph and contains no external assets',async()=>{
  const cwd=new URL('..',import.meta.url);
  const result=spawnSync(process.execPath,['build-preview.mjs'],{
    cwd,
    encoding:'utf8',
  });
  assert.equal(result.status,0,result.stderr||result.stdout);
  const preview=await readFile(new URL('../preview.html',import.meta.url),'utf8');
  assert.match(preview,/<style>[\s\S]+<\/style>/);
  assert.match(preview,/<script>[\s\S]+<\/script>/);
  assert.doesNotMatch(preview,/src=["']\.\/app\.mjs["']/);
  assert.doesNotMatch(preview,/href=["']\.\/style\.css["']/);
  assert.doesNotMatch(preview,/\bimport\s+(?:["'{*]|[A-Za-z_$])/);
  assert.match(preview,/sourceMappingURL=data:application\/json;base64,/);
});
