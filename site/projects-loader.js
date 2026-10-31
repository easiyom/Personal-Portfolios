import {validateProject} from './project-model.js';
window.PORTFOLIO_READY = (async()=>{
  const c=window.SITE_CONFIG;
  if(!c?.url||!c?.key) return;
  try {
    const r=await fetch(`${c.url}/rest/v1/projects?select=id,data,sort_order&published=eq.true&order=sort_order.asc,id.asc`,{headers:{apikey:c.key},signal:AbortSignal.timeout(10000),cache:'no-store'});
    if(!r.ok) throw Error('Projects unavailable');
    const rows=await r.json();
    window.PORTFOLIO.projects=rows.map((row,i)=>({...validateProject({...row.data,id:row.id}),number:String(i+1).padStart(2,'0')}));
  } catch {
    window.PORTFOLIO.projects=[];
    window.PROJECT_LOAD_ERROR=true;
  }
})();
