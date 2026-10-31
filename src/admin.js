import {createClient} from '@supabase/supabase-js';
import {imageURL,validateProject} from '../site/project-model.js';
const $=s=>document.querySelector(s), form=$('#editor');
const say=(s,error=false)=>{$('#message').textContent=s;$('#message').classList.toggle('error',error);};
const c=window.SITE_CONFIG;let client,rows=[],current=null,images=[],cover='',dirty=false,busy=false;
const field=n=>form.elements.namedItem(n);
const lines=s=>s.split('\n').map(x=>x.trim()).filter(Boolean);
const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
function lock(value){busy=value;form.querySelectorAll('button,input,textarea').forEach(n=>{if(value){n.dataset.wasDisabled=String(n.disabled);n.disabled=true;}else{if(n.dataset.wasDisabled!==undefined)n.disabled=n.dataset.wasDisabled==='true';delete n.dataset.wasDisabled;}});$('#new').disabled=value;$('#signout').disabled=value;$('#project-list').querySelectorAll('button').forEach(n=>n.disabled=value);if(!value)field('id').readOnly=!!current;}
async function action(fn){if(busy)return;lock(true);try{await fn();}catch(e){say(e.message||'Operation failed. Try again.',true);}finally{lock(false);}}
function discard(){return !dirty||confirm('Discard unsaved changes?');}
function renderImages(){
 $('#image-list').replaceChildren();
 images.forEach(([url,caption],i)=>{
  const row=node('div');row.className='image-editor';const img=node('img');img.src=imageURL(url);img.alt=caption;
  const detail=node('div'),label=node('label','Caption / alternative text'),input=node('input');input.value=caption;input.required=true;input.maxLength=1000;input.oninput=()=>{images[i][1]=input.value;dirty=true;};label.append(input);detail.append(label);
  const actions=node('div');actions.className='image-actions';
  const add=(title,fn,disabled=false)=>{const b=node('button',title);b.type='button';b.disabled=disabled;b.onclick=()=>{fn();dirty=true;renderImages();};actions.append(b);};
  add(url===cover?'✓ Cover':'Use as cover',()=>cover=url);add('↑',()=>{[images[i-1],images[i]]=[images[i],images[i-1]];},i===0);add('↓',()=>{[images[i+1],images[i]]=[images[i],images[i+1]];},i===images.length-1);add('Remove',()=>{images.splice(i,1);if(cover===url)cover=images[0]?.[0]||'';});
  detail.append(actions);row.append(img,detail);$('#image-list').append(row);
 });
}
function edit(row){
 if(!discard())return;current=row||null;form.reset();const p=row?.data||{};
 for(const key of ['id','title','category','subtitle','role','description','contribution'])field(key).value=key==='id'?(row?.id||''):(p[key]||'');
 for(const key of ['tags','highlights'])field(key).value=(p[key]||[]).join('\n');
 field('facts').value=(p.facts||[]).map(x=>x.join(' | ')).join('\n');field('published').checked=!!row?.published;field('sort_order').value=row?.sort_order??rows.length;
 field('id').readOnly=!!row;images=structuredClone(p.images||[]);cover=p.cover||'';renderImages();dirty=false;form.hidden=false;$('#empty-editor').hidden=true;$('#delete').hidden=!row;$('#editor-heading').textContent=row?'Edit project':'New project';
}
async function refresh(){const {data,error}=await client.from('projects').select('*').order('sort_order').order('id');if(error)throw error;rows=data;$('#project-list').replaceChildren();rows.forEach(row=>{const b=node('button',row.data.title||row.id);b.append(node('small',`${row.published?'Published':'Draft'} · Order ${row.sort_order}`));b.onclick=()=>{if(!busy)edit(row);};$('#project-list').append(b);});if(!rows.length)$('#project-list').append(node('p','No projects yet. Create your first project or run the seed SQL.'));}
async function session(){
 const {data:{session},error}=await client.auth.getSession();if(error)throw error;
 $('#login').hidden=!!session;$('#dashboard').hidden=true;$('#signout').hidden=!session;
 if(!session){say('Sign in to manage your portfolio.');return;}
 const {data:allowed,error:accessError}=await client.rpc('is_portfolio_admin');if(accessError)throw accessError;
 if(!allowed){say('This account is not an editor. Grant its user UUID access in portfolio_admins.',true);return;}
 $('#dashboard').hidden=false;await refresh();say('Connected. Published changes appear when visitors reload the portfolio.');
}
if(!c?.url||!c?.key){$('#setup').hidden=false;say('Preview mode — the shared project database is not connected.');}
else {client=createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});session().catch(e=>say(e.message,true));client.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'){dirty=false;current=null;images=[];form.hidden=true;$('#dashboard').hidden=true;$('#signout').hidden=true;$('#login').hidden=false;say('Signed out.');}});}
$('#login').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{const {error}=await client.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value});if(error)throw error;$('#password').value='';await session();}catch(e){say(e.message,true);}finally{b.disabled=false;}};
$('#signout').onclick=()=>{if(discard())action(async()=>{const {error}=await client.auth.signOut();if(error)throw error;});};
$('#new').onclick=()=>edit(null);form.addEventListener('input',()=>dirty=true);
$('#upload').onchange=()=>action(async()=>{
 const files=[...$('#upload').files];if(images.length+files.length>30)throw Error('Maximum 30 images per project.');
 for(const f of files){if(!['image/jpeg','image/png','image/webp','image/avif'].includes(f.type)||f.size>5242880)throw Error('Use JPEG, PNG, WebP or AVIF images up to 5 MB.');}
 for(const f of files){say(`Uploading ${f.name}…`);const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'}[f.type],path=`${crypto.randomUUID()}.${ext}`;const {error}=await client.storage.from('project-images').upload(path,f,{contentType:f.type,upsert:false});if(error)throw error;const {data}=client.storage.from('project-images').getPublicUrl(path);images.push([data.publicUrl,f.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ')]);if(!cover)cover=data.publicUrl;dirty=true;renderImages();}
 $('#upload').value='';say('Images uploaded. Review captions and save the project.');
});
form.onsubmit=e=>{e.preventDefault();action(async()=>{
 const p={};for(const key of ['id','title','category','subtitle','role','description','contribution'])p[key]=field(key).value.trim();for(const key of ['tags','highlights'])p[key]=lines(field(key).value);
 p.facts=lines(field('facts').value).map(s=>{const at=s.indexOf('|');if(at<1||!s.slice(at+1).trim())throw Error('Use label | value for each fact.');return [s.slice(0,at).trim(),s.slice(at+1).trim()];});p.images=images;p.cover=cover;validateProject(p);
 const row={id:p.id,data:p,published:field('published').checked,sort_order:Number(field('sort_order').value)};
 let query=current?client.from('projects').update(row).eq('id',current.id).eq('updated_at',current.updated_at):client.from('projects').insert(row);
 const {data,error}=await query.select();if(error)throw error;if(!data.length)throw Error('This project changed in another session. Reload before editing again.');dirty=false;await refresh();edit(data[0]);say(row.published?'Project published. Reload the portfolio to see it.':'Draft saved. It is hidden from visitors.');
});};
$('#delete').onclick=()=>{if(current&&confirm(`Delete “${current.data.title}”? This removes it from the portfolio. Stored images are retained.`))action(async()=>{const {data,error}=await client.from('projects').delete().eq('id',current.id).eq('updated_at',current.updated_at).select('id');if(error)throw error;if(!data.length)throw Error('Project changed in another session. Reload first.');dirty=false;current=null;form.hidden=true;$('#empty-editor').hidden=false;await refresh();say('Project deleted.');});};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
