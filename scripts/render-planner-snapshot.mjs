// Local print QA only. Inputs and output stay outside the public repository.
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const [input, destination] = process.argv.slice(2);
if (!input || !destination) throw new Error('Usage: node scripts/render-planner-snapshot.mjs INPUT.json OUTPUT_DIRECTORY');
const server = await createServer({server:{middlewareMode:true,hmr:false,ws:false}});
try {
  const {PlannerPrintSheet} = await server.ssrLoadModule('/src/pages/PlannerPrintPage.tsx');
  const {normalizePlan} = await server.ssrLoadModule('/src/services/planner-layout.ts');
  const plan = normalizePlan(JSON.parse(readFileSync(input,'utf8')));
  const css = readdirSync('dist/assets').filter(name=>name.endsWith('.css')).map(name=>readFileSync('dist/assets/'+name,'utf8')).join('');
  const html = renderToStaticMarkup(createElement(MemoryRouter,null,createElement(PlannerPrintSheet,{data:plan})));
  mkdirSync(destination,{recursive:true,mode:0o700});
  writeFileSync(resolve(destination,'plan.html'),'<!doctype html><html><head><meta charset="utf-8"><title>September 7–11 weekly plan</title><style>'+css+'</style></head><body>'+html+'</body></html>',{mode:0o600});
  console.log(resolve(destination,'plan.html'));
} finally { await server.close(); }
