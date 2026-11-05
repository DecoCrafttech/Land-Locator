import {useState} from 'react';
import {Check,MapPin,Pencil,Ruler,Trash2,Undo2,X} from 'lucide-react';
import {MapView} from '../../../packages/shared/src/Map';
import {areaSqft,polygonArea,boundaryError,money,type BoundaryPoint,type PropertyInput} from '../../../packages/shared/src/index';

type Props={property:PropertyInput;onChange:(points:BoundaryPoint[])=>void;onPin:(lat:number,lng:number)=>void};
const number=(value:number)=>value.toLocaleString('en-IN',{maximumFractionDigits:2});
export function BoundaryEditor({property:p,onChange,onPin}:Props){
  const points=p.boundary||[];
  const [mode,setMode]=useState<'pin'|'draw'|'edit'|'view'>(points.length?'view':'pin');
  const [zoom,setZoom]=useState(points.length?19:17);
  const error=boundaryError(points);
  const valid=points.length>=3&&!error;
  const mapped=valid?polygonArea(points):0;
  const entered=p.area>0?areaSqft(p.area,p.unit)/areaSqft(1,'sq.m'):0;
  const mappedInUnit=mapped?areaSqft(mapped,'sq.m')/areaSqft(1,p.unit):0;
  const difference=entered&&valid?(mapped-entered)/entered*100:null;
  const changing=mode==='draw'||mode==='edit';
  const change=(next:BoundaryPoint[])=>{if(next.length<=100)onChange(next);};
  return <section className="boundary-editor" aria-label="Land boundary editor">
    <div className="boundary-toolbar">
      <button className={`secondary ${mode==='pin'?'is-active':''}`} onClick={()=>setMode('pin')}><MapPin size={15}/>Move pin</button>
      {!changing?<button className="primary" onClick={()=>{setMode(points.length?'edit':'draw');if(!points.length)setZoom(19);}}><Pencil size={15}/>{points.length?'Adjust corners':'Draw boundary'}</button>:<button className="primary" disabled={!valid} onClick={()=>setMode('view')}><Check size={15}/>{mode==='draw'?'Finish drawing':'Done adjusting'}</button>}
    </div>
    <p className="boundary-instruction" role="status">{mode==='draw'?'Tap the map to mark each corner. The last edge closes automatically.':mode==='edit'?'Drag the numbered corners to adjust the boundary.':mode==='pin'?'Tap the map or drag the property pin. Moving the pin does not move a drawn boundary.':valid?'Boundary marked by the agent. Choose Adjust corners to make changes.':'Choose Draw boundary and mark at least three corners.'}</p>
    <div className="wizard-map boundary-editor-map"><MapView
      markers={[{id:'pin',lat:Number.isFinite(p.lat)?p.lat:11.026,lng:Number.isFinite(p.lng)?p.lng:77.008,kind:'property',name:'Property location'}]}
      center={[Number.isFinite(p.lat)?p.lat:11.026,Number.isFinite(p.lng)?p.lng:77.008]} zoom={zoom}
      onPin={mode==='pin'?onPin:undefined}
      boundary={points} autoFitBoundary={mode==='view'||mode==='edit'} onBoundaryChange={changing?change:undefined}
      drawing={mode==='draw'} onVertex={(lat,lng)=>change([...points,{lat,lng}])}
      boundaryLabel={valid?{size:`${number(p.area||0)} ${p.unit} · declared`,price:money(p.price||0,p.period)}:undefined}
    /></div>
    <div className="boundary-actions">
      {points.length>0&&<><span>{points.length} corners</span>{mode!=='draw'&&<button className="text-button" onClick={()=>setMode('draw')}><Pencil size={13}/>Add corners</button>}<button className="text-button" onClick={()=>change(points.slice(0,-1))}><Undo2 size={14}/>Undo corner</button><button className="text-button boundary-remove" onClick={()=>{change([]);setMode('pin');}}><Trash2 size={14}/>Remove boundary</button></>}
    </div>
    {!points.length?<div className="notice"><Ruler size={17}/>No boundary marked. A location pin and land size cannot determine the land shape. Draw the corners using the actual parcel information.</div>:<>
      {error&&<p className="field-error" role="alert">{error}</p>}
      <div className="boundary-comparison" aria-label="Land area comparison">
        <div><small>Entered land size</small><strong>{number(p.area||0)} {p.unit}</strong><span>{number(entered)} sq.m</span></div>
        <div><small>Approx. map area</small><strong data-testid="measured-boundary-area">{valid?`${number(mappedInUnit)} ${p.unit}`:'Not complete'}</strong><span>{valid?`${number(mapped)} sq.m`:'Complete a valid boundary'}</span></div>
      </div>
      {difference!==null&&<p className="boundary-difference" data-testid="boundary-difference">{Math.abs(difference)<.05?'The measured area matches the entered size within rounding.':`The drawn area is ${number(Math.abs(difference))}% ${difference>0?'larger':'smaller'} than the entered size.`} The entered size has not been changed.</p>}
      <details className="boundary-coordinates"><summary>Corner coordinates</summary>{points.map((v,i)=><div key={i} className="boundary-vertex"><label>Corner {i+1} latitude<input type="number" step="any" value={v.lat} onChange={e=>change(points.map((point,j)=>j===i?{...point,lat:Number(e.target.value)}:point))}/></label><label>Longitude<input type="number" step="any" value={v.lng} onChange={e=>change(points.map((point,j)=>j===i?{...point,lng:Number(e.target.value)}:point))}/></label><button className="icon-btn" aria-label={`Remove corner ${i+1}`} onClick={()=>change(points.filter((_,j)=>j!==i))}><X size={16}/></button></div>)}</details>
    </>}
    <p className="boundary-disclaimer">Agent-marked boundaries and map areas are approximate. They are not a legal land survey.</p>
  </section>;
}
