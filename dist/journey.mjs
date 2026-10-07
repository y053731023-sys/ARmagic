export const CLIPS={second:{start:1.15,end:9.85}};
export class Journey {
 constructor(){this.reset();}
 reset(){this.phase='second';this.time=0;this.visible=false;this.stable=0;}
 get clip(){return CLIPS[this.phase];}
 get ready(){return this.visible&&this.stable>=.35&&!!this.clip;}
 get atClipEnd(){return !!this.clip&&this.time>=this.clip.end-this.clip.start-.04;}
 update(dt,mediaTime=null){
  dt=Math.min(Math.max(dt,0),.08);if(this.phase==='done')return;
  if(!this.visible){this.stable=0;return;}
  this.stable+=dt;if(!this.ready)return;
  if(Number.isFinite(mediaTime))this.time=Math.max(this.time,Math.min(this.clip.end-this.clip.start,mediaTime-this.clip.start));
  if(this.atClipEnd){this.phase='done';this.time=0;}
 }
}
