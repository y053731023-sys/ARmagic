export const GREETING_DURATION=5.2;
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const mix=(a,b,t)=>a+(b-a)*t;
export function greetingPose(t){
 const entry=clamp(t/.68),point=ease((t-2.25)/.5),wave=clamp((t-.68)/1.57);
 return {opacity:ease(t/.10)*(1-ease((t-4.3)/.9)),jump:-115*Math.sin(Math.PI*entry),scale:mix(.68,1,ease(t/.22)),squash:Math.sin(clamp((t-.58)/.22)*Math.PI)*.12,
  waveAngle:wave>0&&wave<1?Math.sin(wave*Math.PI*4)*.48:0,point,
  label:t<.68?'跳出來了！':t<2.5?'他在跟你打招呼。':t<4.3?'看，他指向右邊。':'他正在隱形…'};
}
export function createGreeting(THREE){
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=900;const ctx=canvas.getContext('2d');
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.8,1.125),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
 function draw(t){const p=greetingPose(t);ctx.clearRect(0,0,640,900);ctx.save();ctx.globalAlpha=p.opacity;ctx.translate(290,700+p.jump);ctx.scale(p.scale*(1+p.squash),p.scale*(1-p.squash));
  const pointing=p.point;
  const shoulder=[10,-282],elbow=[mix(80,102,pointing),mix(-326,-282,pointing)];
  const a=-1.36+p.waveAngle;
  const wrist=[mix(elbow[0]+Math.cos(a)*91,211,pointing),mix(elbow[1]+Math.sin(a)*91,-282,pointing)];
  const paths=[[[0,-320],[0,-190]],[[0,-192],[-52,-99],[-66,-4],[-103,0]],[[0,-192],[48,-107],[57,-5],[98,0]],[[0,-282],[-70,-213],[-90,-149]], [shoulder,elbow,wrist]];
  // All body parts are flat, stroked ink silhouettes on one transparent plane.
  function stroke(points,width,color){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();}
  for(const outline of [true,false]){
   ctx.shadowColor=outline?'rgba(255,255,255,.6)':'transparent';ctx.shadowBlur=outline?7:0;
   paths.forEach((path,i)=>stroke(path,(i===0?24:18)+(outline?5:0),outline?'#f7f7ef':'#070908'));
   ctx.beginPath();ctx.ellipse(mix(0,8,pointing),-388,63,70,pointing*.06,0,Math.PI*2);ctx.fillStyle=outline?'#f7f7ef':'#070908';if(outline){ctx.lineWidth=5;ctx.strokeStyle='#f7f7ef';ctx.stroke();}ctx.fill();
   ctx.shadowBlur=0;
   const color=outline?'#f7f7ef':'#070908',width=outline?12:7;
   if(pointing<.98){ctx.save();ctx.globalAlpha*=1-pointing;const [x,y]=wrist;for(let i=0;i<4;i++){const angle=-2.1+i*.43+p.waveAngle*.5;stroke([[x,y],[x+Math.cos(angle)*29,y+Math.sin(angle)*29]],width,color);}stroke([[x,y],[x-24,y-4]],width,color);ctx.restore();}
   if(pointing>0){ctx.save();ctx.globalAlpha*=pointing;stroke([wrist,[wrist[0]+41,wrist[1]]],width,color);stroke([[wrist[0]+7,wrist[1]],[wrist[0]+14,wrist[1]+17],[wrist[0]-4,wrist[1]+15]],width,color);ctx.restore();}
  }
  ctx.restore();texture.needsUpdate=true;
 }
 draw(0);return {mesh,draw};
}
