import {describe,it,expect} from 'vitest';
import {boundaryError,polygonArea,propertySchema,parsePropertyPatch,areaSqft} from '../packages/shared/src/index';
import {demoProperties} from '../backend/src/seed';
const square=[{lat:11,lng:77},{lat:11,lng:77.001},{lat:11.001,lng:77.001},{lat:11.001,lng:77}];
describe('Agent-drawn land boundaries',()=>{
  it('never invents a polygon from a pin and entered land size',()=>{const {boundary,...input}=demoProperties[0];expect(propertySchema.parse({...input,area:1,unit:'acre'}).boundary).toEqual([]);expect(boundaryError([])).toBeNull();});
  it('calculates area independently of winding and converts entered units consistently',()=>{const area=polygonArea(square);expect(area).toBeGreaterThan(12000);expect(area).toBeLessThan(12300);expect(polygonArea([...square].reverse())).toBeCloseTo(area,3);expect(areaSqft(100,'cent')).toBe(areaSqft(1,'acre'));expect(areaSqft(100,'sq.m')/areaSqft(1,'sq.m')).toBeCloseTo(100);});
  it('rejects incomplete, repeated, crossing and collapsed boundaries',()=>{expect(boundaryError(square.slice(0,2))).toMatch(/three corners/);expect(boundaryError([...square,square[0]])).toMatch(/distinct/);expect(boundaryError([square[0],square[2],square[1],square[3]])).toMatch(/cross/);expect(boundaryError([{lat:11,lng:77},{lat:11,lng:77.001},{lat:11,lng:77.002}])).toMatch(/enclose/);expect(boundaryError(square)).toBeNull();});
  it('validates boundary edits and removal without resetting other listing fields',()=>{expect(parsePropertyPatch({boundary:square})).toEqual({boundary:square});expect(parsePropertyPatch({boundary:[]})).toEqual({boundary:[]});expect(()=>parsePropertyPatch({boundary:square.slice(0,2)})).toThrow();expect(()=>propertySchema.parse({...demoProperties[0],boundary:[...square,{lat:95,lng:77}]})).toThrow();});
  it('updates area when a corner moves without changing the declared area',()=>{const p={...demoProperties[0],boundary:square};const edited=square.map((v,i)=>i===1?{...v,lng:v.lng+.0005}:v);expect(polygonArea(edited)).toBeGreaterThan(polygonArea(p.boundary));expect(p.area).toBe(demoProperties[0].area);});
});
