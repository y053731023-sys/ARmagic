// Choose between the two equivalent poses of the symmetric card back.
// Positive projected Y points toward the top of the camera viewport.
export function uprightRotation(dx,dy,previous=0){
 const length=Math.hypot(dx,dy);
 if(!Number.isFinite(length)||length<1e-6)return previous;
 const up=dy/length;
 if(up>.22)return 0;
 if(up<-.22)return Math.PI;
 return previous;
}
