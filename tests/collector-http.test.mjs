import assert from 'node:assert/strict';
import test from 'node:test';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
for(const mode of ['length','chunked','eof','truncated-length','truncated-chunked']){
  test(`collector survives paused peer close and validates ${mode} response`,()=>{
    const result=spawnSync(process.execPath,['--import','./scripts/collector-http.mjs','tests/fixtures/http-paused-peer.mjs',mode],{cwd:root,encoding:'utf8',timeout:10000});
    assert.equal(result.status,0,`${result.error??''}\n${result.stderr}`);
    assert.match(result.stdout,new RegExp(`verified ${mode}`));
  });
}
test('production collector loads the fixed client before TypeScript and collector imports',()=>{
  const {scripts}=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
  assert.match(scripts['sync:jobs'],/--import \.\/scripts\/collector-http\.mjs --import tsx scripts\/sync-jobs\.ts$/);
});
