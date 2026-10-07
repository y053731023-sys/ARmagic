export function bindHold(button,{onTap,onHold,delay=1000}){
 let timer=null,start=null,fired=false,suppress=false;
 const cancel=()=>{clearTimeout(timer);timer=null;start=null;button.classList.remove('holding');};
 button.addEventListener('pointerdown',e=>{if(e.button!==0||start)return;e.preventDefault();fired=false;suppress=false;start={x:e.clientX,y:e.clientY,id:e.pointerId};button.setPointerCapture?.(e.pointerId);button.classList.add('holding');timer=setTimeout(()=>{timer=null;fired=true;suppress=true;button.classList.remove('holding');void onHold();},delay);});
 button.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>14){suppress=true;cancel();}});
 button.addEventListener('pointerup',e=>{if(!start)return;const held=fired;cancel();suppress=true;if(!held)onTap();});
 for(const name of ['pointercancel','lostpointercapture'])button.addEventListener(name,()=>{suppress=true;cancel();});
 button.addEventListener('contextmenu',e=>e.preventDefault());
 button.addEventListener('click',e=>{e.preventDefault();if(suppress){suppress=false;return;}if(e.detail===0)onTap();});
 button.addEventListener('keydown',e=>{if(![' ','Enter'].includes(e.key)||e.repeat)return;e.preventDefault();fired=false;button.classList.add('holding');timer=setTimeout(()=>{fired=true;suppress=true;void onHold();},delay);});
 button.addEventListener('keyup',e=>{if(![' ','Enter'].includes(e.key))return;e.preventDefault();const held=fired;cancel();suppress=true;if(!held)onTap();});
 button.addEventListener('blur',cancel);return cancel;
}
