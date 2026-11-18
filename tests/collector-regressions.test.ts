import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { classifyRoleTags } from "../lib/role-areas";

test("collector HTML parsing does not initialize the unused external network dispatcher", () => {
  const code = `import './lib/source-parsers.ts'; import './lib/listing-health.ts'; import './lib/microsoft-careers.ts'; import './lib/usajobs.ts';
    import {createRequire} from 'node:module'; const r=createRequire(import.meta.url);
    const loaded=Object.keys(r.cache).filter(x=>x.replaceAll('\\\\','/').includes('/node_modules/undici/'));
    if(loaded.length)throw new Error('Collector initialized external Undici');`;
  execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", code], { cwd: process.cwd(), timeout: 30_000 });
});

test("specific AI and IT internships map to supported work without accepting generic AI titles", () => {
  const fixtures = [
    ["Summer IT AI Intern", "Support IT infrastructure and network security.", "it-support-network"],
    ["Intern, AI System Architecture Research Scientist", "Research AI memory architecture.", "data-science"],
    ["2027 Summer Intern, Generative AI based Imaging and Video R&D", "Develop generative AI algorithms for imaging.", "data-science"],
    ["AI/ML Intern - Summer 2027", "Build and train models.", "ai-ml-engineering"],
    ["AI Solutions Intern", "Business discovery, workflow analysis and requirements documentation.", "business-analyst"],
  ];
  for (const [title, rawText, tag] of fixtures) assert.ok(classifyRoleTags({title, rawText, category:"Internship"}).includes(tag as never), title);
  for (const title of ["AI Education Intern", "AI Recruiting Intern", "Social Media AI Intern", "AI Marketing Intern", "AI Intern", "Senior AI Research Scientist", "AI Sales Intern"]) {
    const tags=classifyRoleTags({title,category:"Internship",rawText:"Our company builds AI models and uses network security."});
    assert.ok(!tags.includes("ai-ml-engineering") && !tags.includes("data-science") && !tags.includes("it-support-network"), title);
  }
});

test("graduate research scientist titles require concrete ML development duties",()=>{
  const rawText="Build industry-leading recommendation system. Deliver end-to-end machine learning solutions and optimize algorithms. Minimum qualifications: completing a computer science degree.";
  assert.ok(classifyRoleTags({title:"(General Hire) Research Scientist Graduate (TikTok Recommendation) - 2027 Start",rawText,category:"New grad"}).includes("data-science"));
  for(const title of ["Research Scientist", "Senior Research Scientist Graduate", "Clinical Research Scientist Graduate", "Research Scientist Graduate - Marketing"])
    assert.ok(!classifyRoleTags({title,rawText,category:"New grad"}).includes("data-science"),title);
  assert.ok(!classifyRoleTags({title:"Research Scientist Graduate",rawText:"Our company uses machine learning for advertising.",category:"New grad"}).includes("data-science"));
});
