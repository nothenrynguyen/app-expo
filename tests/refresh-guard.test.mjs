import assert from "node:assert/strict";
import test from "node:test";
import { refreshNeeded } from "../scripts/check-refresh-needed.mjs";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const now = Date.parse("2026-10-26T12:37:00Z");
test("workflow skips a queued duplicate only after its slot has been generated", () => {
  assert.equal(refreshNeeded("2026-10-26T12:20:00Z", "workflow_dispatch", "2026-10-26T12:17:00.000Z", now), false);
  assert.equal(refreshNeeded("2026-10-26T11:20:00Z", "workflow_dispatch", "2026-10-26T12:17:00.000Z", now), true);
});
test("manual refresh remains available while backup cron avoids recent ingestion", () => {
  assert.equal(refreshNeeded("2026-10-26T12:20:00Z", "workflow_dispatch", "", now), true);
  assert.equal(refreshNeeded("2026-10-26T12:20:00Z", "schedule", "", now), false);
  assert.equal(refreshNeeded("2026-10-26T11:20:00Z", "schedule", "", now), true);
});
test("missing snapshot regenerates and invalid scheduler slots are rejected", () => {
  assert.equal(refreshNeeded(undefined, "schedule", "", now), true);
  assert.throws(() => refreshNeeded("2026-10-26T11:20:00Z", "workflow_dispatch", "bad", now), /Invalid refresh slot/);
  assert.throws(() => refreshNeeded("2026-10-26T11:20:00Z", "workflow_dispatch", "2027-01-01T00:00:00.000Z", now), /Invalid refresh slot/);
});

test("failed refresh retry-state commits cannot include an already staged public snapshot", async () => {
  const workflow=await readFile(new URL('../.github/workflows/sync-jobs.yml',import.meta.url),'utf8');
  const fallback=workflow.split('- name: Preserve retry state after a blocked refresh')[1];
  assert.match(fallback,/if: failure\(\)/);
  assert.match(fallback,/git commit --only/);
  const files=fallback.match(/git commit --only[^\n]+ -- ([^\n]+)/)[1].trim().split(/\s+/);
  assert.deepEqual(files,['data/workday-schedule.json','data/employer-recovery-state.json']);
  const prefix=path.join(tmpdir(),'empluzzed-retry-state-');
  const root=await mkdtemp(prefix);
  const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
  try {
    await mkdir(path.join(root,'public'));await mkdir(path.join(root,'data'));
    await writeFile(path.join(root,'public/jobs.json'),'published');
    for(const file of files)await writeFile(path.join(root,file),'old retry state');
    git('init');git('config','user.name','test');git('config','user.email','test@example.invalid');git('add','.');git('commit','-m','baseline');
    await writeFile(path.join(root,'public/jobs.json'),'rejected proposal');git('add','public/jobs.json');
    for(const file of files)await writeFile(path.join(root,file),'new retry state');
    git('commit','--only','-m','preserve retry facts','--',...files);
    assert.equal(git('show','HEAD:public/jobs.json'),'published');
    assert.equal(git('show',`HEAD:${files[0]}`),'new retry state');
    assert.equal(git('show',`HEAD:${files[1]}`),'new retry state');
    assert.match(git('status','--porcelain'),/public\/jobs.json/);
  } finally {
    assert.ok(path.resolve(root).startsWith(path.resolve(prefix)));
    await rm(root,{recursive:true,force:true});
  }
});
