import {useCallback,useEffect,useRef,type RefObject} from 'react';
import L from 'leaflet';
import {boundaryError,type BoundaryPoint} from './index';

type Options={leaf:RefObject<L.Map|null>;gmap:RefObject<google.maps.Map|null>;ready:boolean;boundary:BoundaryPoint[];onChange?:((points:BoundaryPoint[])=>void);autoFit:boolean};

export function useBoundaryLayer({leaf,gmap,ready,boundary,onChange,autoFit}:Options){
  const latest=useRef({boundary,onChange});latest.current={boundary,onChange};
  const signature=JSON.stringify(boundary),editable=!!onChange;
  const fitted=useRef(false);
  const fit=useCallback(()=>{
    const points=latest.current.boundary;if(points.length<3)return;
    if(leaf.current)leaf.current.fitBounds(L.latLngBounds(points.map(p=>[p.lat,p.lng])),{padding:[45,65],maxZoom:20,animate:false});
    if(gmap.current){const bounds=new google.maps.LatLngBounds();points.forEach(p=>bounds.extend(p));gmap.current.fitBounds(bounds,55);}
  },[leaf,gmap]);

  useEffect(()=>{
    if(!ready)return;
    const points=JSON.parse(signature) as BoundaryPoint[];
    const valid=points.length>=3&&!boundaryError(points);
    const change=(index:number,point:BoundaryPoint)=>{const next=points.map((p,i)=>i===index?point:p);latest.current.onChange?.(next);};
    if(leaf.current){
      const group=L.layerGroup().addTo(leaf.current);
      const coords=points.map(p=>[p.lat,p.lng] as [number,number]);
      const shape=points.length>1?(valid?L.polygon(coords,{color:'#512da8',weight:3,fillColor:'#512da8',fillOpacity:.22,interactive:false}):L.polyline(coords,{color:'#a078b9',weight:3,dashArray:'6 5',interactive:false})).addTo(group):null;
      if(editable)points.forEach((p,index)=>{
        const marker=L.marker([p.lat,p.lng],{draggable:true,autoPan:true,zIndexOffset:1200,title:`Boundary corner ${index+1}`,icon:L.divIcon({className:'boundary-corner',html:`<span>${index+1}</span>`,iconSize:[44,44],iconAnchor:[22,22]})}).addTo(group);
        marker.on('click',e=>L.DomEvent.stopPropagation(e));
        marker.on('drag',()=>{const pos=marker.getLatLng();const next=points.map((v,i)=>i===index?[pos.lat,pos.lng] as [number,number]:[v.lat,v.lng] as [number,number]);shape?.setLatLngs(next);});
        marker.on('dragend',()=>{const p=marker.getLatLng();change(index,{lat:p.lat,lng:p.lng});});
        marker.getElement()?.addEventListener('keydown',e=>{const offsets:Record<string,[number,number]>={ArrowUp:[.00001,0],ArrowDown:[-.00001,0],ArrowLeft:[0,-.00001],ArrowRight:[0,.00001]};const delta=offsets[e.key];if(delta){e.preventDefault();e.stopPropagation();change(index,{lat:p.lat+delta[0],lng:p.lng+delta[1]});}});
      });
      return()=>{group.remove();};
    }
    if(gmap.current){
      const map=gmap.current;
      const shape=points.length>1?(valid?new google.maps.Polygon({map,paths:points,geodesic:true,strokeColor:'#512da8',strokeWeight:3,fillColor:'#512da8',fillOpacity:.22,clickable:false}):new google.maps.Polyline({map,path:points,strokeColor:'#a078b9',strokeWeight:3,clickable:false})):null;
      const corners:google.maps.marker.AdvancedMarkerElement[]=[];
      if(editable)points.forEach((p,index)=>{
        const content=document.createElement('div');content.className='boundary-corner';content.innerHTML=`<span>${index+1}</span>`;
        const marker=new google.maps.marker.AdvancedMarkerElement({map,position:p,content,title:`Boundary corner ${index+1}`,gmpDraggable:true,anchorLeft:'-50%',anchorTop:'-50%',zIndex:1200});corners.push(marker);
        const nextPoints=(e:google.maps.MapMouseEvent)=>{if(!e.latLng)return null;return points.map((v,i)=>i===index?{lat:e.latLng!.lat(),lng:e.latLng!.lng()}:v);};
        marker.addListener('drag',(e:google.maps.MapMouseEvent)=>{const next=nextPoints(e);if(next){if(shape instanceof google.maps.Polygon)shape.setPath(next);else shape?.setPath(next);}});
        marker.addListener('dragend',(e:google.maps.MapMouseEvent)=>{const next=nextPoints(e);if(next)latest.current.onChange?.(next);});
      });
      return()=>{shape?.setMap(null);corners.forEach(c=>{google.maps.event.clearInstanceListeners(c);c.map=null;});};
    }
  },[ready,signature,editable,leaf,gmap]);

  useEffect(()=>{if(!boundary.length)fitted.current=false;if(ready&&autoFit&&!fitted.current&&boundary.length>=3&&!boundaryError(boundary)){fit();fitted.current=true;}},[ready,autoFit,signature,fit]);
  return fit;
}
