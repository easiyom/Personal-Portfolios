import fs from 'node:fs';import vm from 'node:vm';
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('site/content.js','utf8'),ctx);
const covers={water:'project1.jpg',energy:'energy-1.jpg',switch:'switch-1.jpg',node:'node-1.jpg'};
for(const p of ctx.window.PORTFOLIO.projects){if(covers[p.id])p.cover=covers[p.id];p.images.sort((a,b)=>(b[0]===p.cover)-(a[0]===p.cover));}
fs.writeFileSync('site/content.js','/* Portfolio defaults. Database projects replace these after setup. */\nwindow.PORTFOLIO = '+JSON.stringify(ctx.window.PORTFOLIO,null,2)+';\n');
const quote=s=>"'"+s.replaceAll("'","''")+"'";
fs.writeFileSync('database/seed.sql','-- Run after schema.sql. Existing project IDs are never overwritten.\n'+ctx.window.PORTFOLIO.projects.map((p,i)=>`insert into public.projects(id,data,sort_order,published) values (${quote(p.id)},${quote(JSON.stringify(p))}::jsonb,${i},true) on conflict(id) do nothing;`).join('\n')+'\n');
