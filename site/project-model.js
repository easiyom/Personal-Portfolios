/* Shared validation for public rendering and the admin editor. */
export function imageURL(value) {
  if(typeof value !== 'string') return '';
  if (/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|avif)$/i.test(value)) return `assets/images/${value}`;
  try {const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';} catch {return '';}
}
export function validateProject(p) {
  if(!p || !/^[a-z0-9-]{1,64}$/.test(p.id)) throw Error('Project ID: use 1–64 lowercase letters, numbers or hyphens.');
  for(const k of ['title','category','subtitle','role','description','contribution']) if(typeof p[k]!=='string'||!p[k].trim()||p[k].length>6000) throw Error(`Please complete ${k} (maximum 6000 characters).`);
  for(const k of ['tags','highlights']) if(!Array.isArray(p[k])||p[k].length>30||p[k].some(x=>typeof x!=='string'||x.length>2000)) throw Error(`Invalid ${k}.`);
  if(!Array.isArray(p.facts)||p.facts.length>30||p.facts.some(x=>!Array.isArray(x)||x.length!==2||x.some(s=>typeof s!=='string'||s.length>2000))) throw Error('Facts must be label | value pairs.');
  if(!Array.isArray(p.images)||!p.images.length||p.images.length>30||p.images.some(x=>!Array.isArray(x)||!imageURL(x[0])||typeof x[1]!=='string'||!x[1].trim())) throw Error('Add 1–30 images, each with a caption.');
  if(!p.images.some(x=>x[0]===p.cover)) throw Error('The cover must be one of the gallery images.');
  return p;
}
