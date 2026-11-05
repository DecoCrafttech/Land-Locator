export type BoundaryPoint={lat:number;lng:number};
const radians=Math.PI/180;

/** Spherical area in square metres; an estimate, not a cadastral survey. */
export function measuredArea(points:BoundaryPoint[]):number {
  if(points.length<3)return 0;
  const sum=points.reduce((value,p,i)=>{
    const q=points[(i+1)%points.length];
    const delta=((q.lng-p.lng+540)%360-180)*radians;
    return value+delta*(Math.sin(p.lat*radians)+Math.sin(q.lat*radians));
  },0);
  return Math.abs(sum*6371008.8**2/2);
}

export function boundaryError(points:BoundaryPoint[]):string|null {
  if(!points.length)return null;
  if(points.length<3)return 'Mark at least three corners to complete the boundary.';
  if(points.length>100)return 'Use no more than 100 boundary corners.';
  if(points.some(p=>!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||Math.abs(p.lat)>90||Math.abs(p.lng)>180))return 'Enter valid coordinates for every corner.';
  if(new Set(points.map(p=>`${p.lat},${p.lng}`)).size!==points.length)return 'Each corner must be distinct. The final edge closes automatically.';
  const cross=(a:BoundaryPoint,b:BoundaryPoint,c:BoundaryPoint)=>(b.lng-a.lng)*(c.lat-a.lat)-(b.lat-a.lat)*(c.lng-a.lng);
  const onSegment=(a:BoundaryPoint,b:BoundaryPoint,c:BoundaryPoint)=>Math.abs(cross(a,b,c))<1e-14&&c.lng>=Math.min(a.lng,b.lng)-1e-12&&c.lng<=Math.max(a.lng,b.lng)+1e-12&&c.lat>=Math.min(a.lat,b.lat)-1e-12&&c.lat<=Math.max(a.lat,b.lat)+1e-12;
  for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
    if(j===i+1||(i===0&&j===points.length-1))continue;
    const a=points[i],b=points[(i+1)%points.length],c=points[j],d=points[(j+1)%points.length];
    if((cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)||onSegment(a,b,c)||onSegment(a,b,d)||onSegment(c,d,a)||onSegment(c,d,b))return 'Boundary edges must not cross or touch. Drag the corners to fix the shape.';
  }
  if(measuredArea(points)<.01)return 'The boundary must enclose an area. Move the corners apart.';
  return null;
}
