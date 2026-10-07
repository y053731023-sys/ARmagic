import {Journey} from './journey.mjs?v=single-1';
import {uprightRotation} from './orientation.mjs?v=upright-1';
const $=s=>document.querySelector(s),journey=new Journey();
let THREE,renderer,scene,camera,arScene,anchor,art,material,video,blobUrl,texture,videoMesh;
let active=false,demoMode=false,last=0,raf=0,videoReady=false,preparing=false,playPending=false,blocked=false,phaseToken=0;
let cardRotation=0,projectedBase,projectedTop;
function alignArtwork(){
 if(demoMode||!anchor.object3D.visible||!arScene.camera)return;
 const object=anchor.object3D,view=arScene.camera;
 object.updateWorldMatrix(true,false);view.updateWorldMatrix(true,false);
 projectedBase.set(0,-.25,0).applyMatrix4(object.matrixWorld).project(view);
 projectedTop.set(0,.25,0).applyMatrix4(object.matrixWorld).project(view);
 cardRotation=uprightRotation(projectedTop.x-projectedBase.x,projectedTop.y-projectedBase.y,cardRotation);
 art.rotation.z=cardRotation;
}
function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=()=>{el.remove();reject(new Error('無法載入動畫元件'));};document.head.append(el);});}
function eventOnce(el,name,timeout=20000){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>finish(new Error('載入逾時，請重新開啟')),timeout);const ok=()=>finish();const fail=()=>finish(new Error('無法讀取動畫影片'));function finish(e){clearTimeout(timer);el.removeEventListener(name,ok);el.removeEventListener('error',fail);e?reject(e):resolve();}el.addEventListener(name,ok,{once:true});el.addEventListener('error',fail,{once:true});});}
async function loadVideo(){
 video=document.createElement('video');video.className='animation-source';video.muted=true;video.defaultMuted=true;video.playsInline=true;video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');video.preload='auto';video.setAttribute('aria-hidden','true');document.body.append(video);
 $('#resume').textContent='點一下載入動畫';$('#resume').hidden=false;$('#resume').onclick=()=>{video.play().then(()=>{if(!active)video.pause();}).catch(()=>{$('#status').textContent='請再點一下以允許播放動畫';});};const loaded=eventOnce(video,'loadedmetadata',20000);video.src='assets/stickman-mobile.mp4';video.load();await loaded;$('#resume').hidden=true;
 texture=new THREE.VideoTexture(video);texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
 video.addEventListener('error',()=>fail('動畫影片無法播放，請重新開啟網頁。'));
}
function makeArtwork(){
 material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{map:{value:texture},opacity:{value:1}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`
 uniform sampler2D map;uniform float opacity;varying vec2 vUv;
 void main(){
  vec2 p=vec2(vUv.x,0.1+vUv.y*0.8);
  vec3 c=texture2D(map,p).rgb;
  float dominance=(c.g-max(c.r,c.b))/max(c.g,0.015);
  float alpha=1.0-smoothstep(0.10,0.33,dominance);
  if(p.x>0.78&&p.y<0.17)alpha=0.0;
  c.g=min(c.g,max(c.r,c.b)+0.025);
  alpha*=opacity;if(alpha<0.015)discard;
  gl_FragColor=vec4(c,alpha);
 }`});
 const group=new THREE.Group();videoMesh=new THREE.Mesh(new THREE.PlaneGeometry(.98,.98*1280*.8/720),material);group.add(videoMesh);group.visible=false;return group;
}
async function prepareClip(){
 const token=++phaseToken;preparing=true;videoReady=false;video.pause();blocked=false;$('#resume').hidden=true;
 const clip=journey.clip;if(!clip){preparing=false;return;}
 try{if(Math.abs(video.currentTime-clip.start)>.015){const help=setTimeout(()=>{$('#resume').hidden=false;$('#resume').textContent='點一下繼續動畫';},2500);try{const seek=eventOnce(video,'seeked',15000);video.currentTime=clip.start;await seek;}finally{clearTimeout(help);}}if(token===phaseToken){videoReady=true;preparing=false;$('#resume').hidden=true;}}
 catch(e){if(token===phaseToken){preparing=false;fail(e.message);}}
}
function play(){if(!active||playPending||blocked||!videoReady||preparing||!video.paused)return;playPending=true;video.play().catch(e=>{if(e.name!=='AbortError'){blocked=true;$('#resume').hidden=false;}}).finally(()=>playPending=false);}
function stopAR(){const system=arScene?.systems['mindar-image-system'];if(system?.controller){try{system.stop();}catch(e){console.warn(e);}}system?.video?.srcObject?.getTracks().forEach(t=>t.stop());}
function fail(message){document.body.classList.add('error');active=false;cancelAnimationFrame(raf);video?.pause();stopAR();$('#status').hidden=false;$('#status').textContent=message;$('#retry').hidden=false;}
function updateStatus(){
 let text=journey.phase==='done'?'他躲進門裡了。魔術完成。':!journey.visible?'對準藍色牌背':video.currentTime<5.7?'他在牌面上畫了一扇門…':'他走進牌裡了…';if(blocked)text='輕點「繼續動畫」即可播放';if($('#status').textContent!==text)$('#status').textContent=text;
}
function frame(now){
 if(!active)return;const dt=last?(now-last)/1000:0;last=now;const paused=document.hidden||$('#guide').open||$('#photo').open;
 journey.visible=demoMode||anchor.object3D.visible;
 alignArtwork();
 const oldPhase=journey.phase;if(!paused)journey.update(dt,videoReady&&!preparing?video.currentTime:null);
 if(journey.phase!==oldPhase){video.pause();videoReady=false;if(journey.clip)void prepareClip();}
 const canPlay=journey.phase==='second'&&!paused&&journey.ready&&videoReady&&!preparing&&!journey.atClipEnd;
 if(canPlay)play();else video.pause();const buffering=canPlay&&video.readyState<3;document.body.classList.toggle('buffering',buffering);if(buffering){$('#status').textContent='動畫緩衝中…';} art.visible=!!journey.clip&&videoReady&&journey.visible;
 art.position.x=0;material.uniforms.opacity.value=1;videoMesh.visible=journey.phase==='second';
 if(!buffering)updateStatus();if(demoMode)renderer.render(scene,camera);raf=requestAnimationFrame(frame);
}
async function reset(){journey.reset();art.visible=false;await prepareClip();updateStatus();return {phase:journey.phase};}
function setupDemo(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x171e1c);camera=new THREE.PerspectiveCamera(37,$('#stage').clientWidth/$('#stage').clientHeight,.01,100);camera.position.set(0,0,3.4);camera.lookAt(0,0,0);
 renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize($('#stage').clientWidth,$('#stage').clientHeight);$('#stage').append(renderer.domElement);
 const group=new THREE.Group();scene.add(group);group.rotation.set(-.12,.08,0);const cardMap=new THREE.TextureLoader().load('assets/blue-card.jpg');cardMap.colorSpace=THREE.SRGBColorSpace;
 group.add(new THREE.Mesh(new THREE.PlaneGeometry(1,1.38),new THREE.MeshBasicMaterial({map:cardMap})));
 art=makeArtwork();art.position.z=.002;group.add(art);const badge=document.createElement('div');badge.className='demo-tag';badge.textContent='影片動畫預演 · 非即時相機';document.body.append(badge);$('#mode').textContent='影片預演';$('#camera-switch').hidden=false;
 addEventListener('resize',()=>{camera.aspect=$('#stage').clientWidth/$('#stage').clientHeight;camera.updateProjectionMatrix();renderer.setSize($('#stage').clientWidth,$('#stage').clientHeight);});
}
async function setupAR(){
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia)throw new Error('請使用 HTTPS 網址開啟相機');if(!AFRAME.components['mindar-image'])await script('assets/mindar-image-aframe.prod.js');
 arScene=document.createElement('a-scene');arScene.setAttribute('embedded','');arScene.setAttribute('vr-mode-ui','enabled: false');arScene.setAttribute('device-orientation-permission-ui','enabled: false');arScene.setAttribute('renderer','antialias: true; alpha: true; preserveDrawingBuffer: true;');arScene.setAttribute('mindar-image','imageTargetSrc: assets/blue-card.mind; autoStart: false; maxTrack: 1; uiLoading: no; uiScanning: no; uiError: no; warmupTolerance: 5; missTolerance: 5;');
 arScene.innerHTML='<a-entity id="card-anchor" mindar-image-target="targetIndex: 0"></a-entity><a-camera position="0 0 0" look-controls="enabled: false"></a-camera>';$('#stage').append(arScene);if(!arScene.hasLoaded)await eventOnce(arScene,'loaded');anchor=$('#card-anchor');
 arScene.addEventListener('arError',()=>fail('相機無法啟動。請允許相機權限後重試。'));const ready=eventOnce(arScene,'arReady',45000);$('#mode').textContent='相機啟動中';arScene.systems['mindar-image-system'].start();await ready;$('#mode').textContent='AR 相機';$('#status').textContent='相機已開啟，正在載入動畫…';await loadVideo();art=makeArtwork();art.position.z=.002;anchor.object3D.add(art);
}
export async function start(demo){
 if(active)return;demoMode=demo;if(!window.AFRAME)await script('assets/aframe.min.js');THREE=AFRAME.THREE;projectedBase=new THREE.Vector3();projectedTop=new THREE.Vector3();
 $('#intro').hidden=true;$('#status').hidden=false;$('#status').textContent='正在準備影片與相機…';document.body.classList.toggle('live',!demo);
 try{if(demo){await loadVideo();setupDemo();}else await setupAR();await reset();}catch(e){stopAR();video?.pause();throw e;}
 active=true;last=0;$('#resume').textContent='繼續動畫';$('#resume').onclick=()=>{blocked=false;$('#resume').hidden=true;play();};raf=requestAnimationFrame(frame);
 document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden)video.pause();});
 addEventListener('pagehide',()=>{active=false;cancelAnimationFrame(raf);video.pause();stopAR();if(blobUrl)URL.revokeObjectURL(blobUrl);});
 if(document.modelContext?.registerTool){try{await document.modelContext.registerTool({name:'reset_magic_performance',description:'重設影片魔術，重新播放小人走進牌面的效果。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false},async execute(input){if(!input||typeof input!=='object'||Object.keys(input).length)throw new Error('不需要參數');return await reset();}});}catch(e){console.warn(e);}}
}


export {reset as resetPerformance};
export async function capturePhoto({zoom=1,mirrored=false}={}){
 if(!active)throw Error('Camera not ready');
 const stage=$('#stage'),w=stage.clientWidth,h=stage.clientHeight;
 const output=document.createElement('canvas'),ratio=Math.min(devicePixelRatio,2);
 output.width=Math.round(w*ratio);output.height=Math.round(h*ratio);
 const ctx=output.getContext('2d');ctx.scale(ratio,ratio);ctx.translate(w/2,h/2);ctx.scale(zoom*(mirrored?-1:1),zoom);ctx.translate(-w/2,-h/2);
 if(demoMode){renderer.render(scene,camera);ctx.drawImage(renderer.domElement,0,0,w,h);}
 else{
  const feed=arScene.systems['mindar-image-system'].video;
  if(!feed?.videoWidth)throw Error('Camera not ready');
  const scale=Math.max(w/feed.videoWidth,h/feed.videoHeight),dw=feed.videoWidth*scale,dh=feed.videoHeight*scale;
  ctx.drawImage(feed,(w-dw)/2,(h-dh)/2,dw,dh);
  arScene.renderer.render(arScene.object3D,arScene.camera);
  const canvas=arScene.renderer.domElement;
  const cw=parseFloat(canvas.style.width)||w,ch=parseFloat(canvas.style.height)||h;
  const left=parseFloat(canvas.style.left)||0,top=parseFloat(canvas.style.top)||0;
  ctx.drawImage(canvas,left,top,cw,ch);
 }
 return await new Promise((resolve,reject)=>output.toBlob(blob=>blob?resolve(blob):reject(Error('Photo failed')),'image/png'));
}
