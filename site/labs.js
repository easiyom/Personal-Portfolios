import {BAUDS,opticalExchange,wireLabel,ethernetTransfer} from './lab-models.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
// Buttons behave as accessible tabs, including arrow/Home/End navigation.
function activate(tab){$$('[data-lab]').forEach(b=>{const on=b===tab;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;$('#'+b.getAttribute('aria-controls')).hidden=!on;});window.dispatchEvent(new Event('labchange'));stopOptical();pauseEthernet();}
$$('[data-lab]').forEach(b=>{b.onclick=()=>activate(b);b.onkeydown=e=>{const tabs=$$('[data-lab]'),i=tabs.indexOf(b);let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();tabs[n].focus();activate(tabs[n]);}};});
let steps=[],index=0,timer=0;
const optStatus=text=>$('#opt-state').textContent=text;
function stopOptical(){if(timer&&index<steps.length)optStatus('PAUSED');clearTimeout(timer);timer=0;$('#opt-play').textContent='Play exchange ▶';}
function resetOptical(){stopOptical();steps=opticalExchange(Number($('#opt-baud').value),$('#opt-aligned').checked,$('#opt-corrupt').checked);index=0;$('#opt-log').replaceChildren();$('#opt-energy').textContent='—';$('#opt-link').dataset.direction='';$('#opt-rate').textContent='300 baud · 7E1';$('#opt-step').disabled=false;$('#opt-play').disabled=false;optStatus('READY');}
function stepOptical(){
 if(index>=steps.length)return;const s=steps[index++],row=document.createElement('li'),head=document.createElement('strong'),code=document.createElement('pre'),note=document.createElement('p');head.textContent=`${String(index).padStart(2,'0')} / ${s.from} · ${s.baud} baud`;code.textContent=s.wire?(s.wire.startsWith('\x02')?wireLabel(s.wire.slice(0,-1))+`<BCC 0x${s.wire.charCodeAt(s.wire.length-1).toString(16).toUpperCase().padStart(2,'0')}>`:wireLabel(s.wire)):'NO RESPONSE';note.textContent=s.note;row.append(head,code,note);if(s.failed)row.classList.add('failed');$('#opt-log').append(row);$('#opt-log').scrollTop=$('#opt-log').scrollHeight;
 $('#opt-link').dataset.direction=s.from.startsWith('Reader →')?'right':s.from.startsWith('Meter →')?'left':'';$('#opt-rate').textContent=`${s.baud} baud · 7E1`;optStatus(s.failed?'FAILED':s.complete?'COMPLETE':'EXCHANGING');if(s.complete)$('#opt-energy').textContent='12,345.678';
 if(index===steps.length){stopOptical();$('#opt-step').disabled=true;$('#opt-play').disabled=true;}
}
function autoplay(){stepOptical();if(index<steps.length)timer=setTimeout(autoplay,1600);}
$('#opt-play').onclick=()=>{if(timer)stopOptical();else{$('#opt-play').textContent='Pause Ⅱ';autoplay();}};
$('#opt-step').onclick=()=>{stopOptical();stepOptical();};$('#opt-reset').onclick=resetOptical;['#opt-baud','#opt-aligned','#opt-corrupt'].forEach(s=>$(s).onchange=resetOptical);resetOptical();
let running=false,elapsed=0,last=0,frame=0;
function drawEthernet(){
 const bytes=Math.round(Number($('#eth-size').value)*1e6);$('#eth-size-value').textContent=$('#eth-size').value;
 [10,100,1000].forEach(speed=>{const t=ethernetTransfer(bytes,speed),p=Math.min(1,elapsed/t.seconds),row=$(`[data-speed="${speed}"]`);row.querySelector('progress').value=p;row.querySelector('.race-percent').textContent=`${(p*100).toFixed(0)}%`;row.querySelector('.race-time').textContent=`${t.seconds.toFixed(3)} s`;row.querySelector('.race-goodput').textContent=`${t.payloadMbps.toFixed(2)} Mbps payload`;});
 const t=ethernetTransfer(bytes,1000);$('#eth-frames').textContent=t.frames.toLocaleString();$('#eth-efficiency').textContent=`${(t.efficiency*100).toFixed(2)}%`;
 $('#eth-clock').textContent=`${elapsed.toFixed(2)} s`;return ethernetTransfer(bytes,10).seconds;
}
function pauseEthernet(){if(running)$('#eth-state').textContent='PAUSED';running=false;cancelAnimationFrame(frame);$('#eth-play').textContent='Run comparison ▶';}
function tick(now){if(!running)return;elapsed+=(now-last)/1000*Number($('#eth-speed').value);last=now;const end=drawEthernet();if(elapsed>=end){elapsed=end;drawEthernet();pauseEthernet();$('#eth-state').textContent='COMPLETE';}else frame=requestAnimationFrame(tick);}
function resetEthernet(){pauseEthernet();elapsed=0;$('#eth-state').textContent='READY';drawEthernet();}
$('#eth-play').onclick=()=>{if(running){pauseEthernet();$('#eth-state').textContent='PAUSED';return;}if(elapsed>=drawEthernet())elapsed=0;running=true;last=performance.now();$('#eth-play').textContent='Pause Ⅱ';$('#eth-state').textContent='TRANSFERRING';frame=requestAnimationFrame(tick);};
$('#eth-reset').onclick=resetEthernet;$('#eth-size').oninput=resetEthernet;$('#eth-speed').onchange=()=>{if(running)last=performance.now();};resetEthernet();
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopOptical();if(running){pauseEthernet();$('#eth-state').textContent='PAUSED';}}});
// Real photographs on a gently tilted plane, not an invented CAD model.
const motion=matchMedia('(prefers-reduced-motion: reduce)'),pointer=matchMedia('(pointer: fine)');
$$('.hero-visual,.gallery-main').forEach(panel=>{panel.addEventListener('pointermove',e=>{if(motion.matches||!pointer.matches)return;const r=panel.getBoundingClientRect();panel.style.setProperty('--tilt-x',`${-(e.clientY-r.top-r.height/2)/r.height*6}deg`);panel.style.setProperty('--tilt-y',`${(e.clientX-r.left-r.width/2)/r.width*8}deg`);});panel.addEventListener('pointerleave',()=>{panel.style.setProperty('--tilt-x','0deg');panel.style.setProperty('--tilt-y','0deg');});});
