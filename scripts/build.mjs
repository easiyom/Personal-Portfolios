import {build} from 'esbuild';
import {writeFile} from 'node:fs/promises';
const url=process.env.SUPABASE_URL || '', key=process.env.SUPABASE_PUBLISHABLE_KEY || '';
if(Boolean(url)!==Boolean(key)) throw Error('Set both Supabase public environment variables, or neither for static preview.');
if(url && !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) throw Error('Use your https://PROJECT.supabase.co URL.');
if(key && !key.startsWith('sb_publishable_')) throw Error('Use a Supabase publishable key, never a secret or service-role key.');
await writeFile('site/config.js',`window.SITE_CONFIG = ${JSON.stringify({url,key})};\n`);
await build({entryPoints:['src/admin.js'],bundle:true,minify:true,format:'esm',outfile:'site/admin.bundle.js',legalComments:'eof'});
console.log(url?'Built with shared project database.':'Built in static preview mode; admin requires Supabase setup.');
