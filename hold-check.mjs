import assert from 'node:assert/strict';
import {bindHold} from './dist/hold.mjs';
const button=new EventTarget();button.classList={add(){},remove(){}};
let taps=0,holds=0;bindHold(button,{onTap(){taps++},onHold(){holds++},delay:25});
function send(type,props={}){const e=new Event(type,{cancelable:true});Object.assign(e,{button:0,pointerId:1,clientX:0,clientY:0,detail:1,...props});button.dispatchEvent(e);}
const wait=()=>new Promise(r=>setTimeout(r,45));
send('pointerdown');send('pointerup');send('click');assert.equal(taps,1);assert.equal(holds,0);
send('pointerdown');await wait();await wait();send('pointerup');send('click');assert.equal(holds,1);assert.equal(taps,1,'Release after hold must not mirror');
send('pointerdown');send('pointermove',{clientX:30});await wait();send('pointerup');send('click');assert.equal(holds,1);assert.equal(taps,1);
send('pointerdown');send('pointercancel');await wait();assert.equal(holds,1);
console.log('PASS: tap, single long hold, release suppression, movement and touch cancellation.');
