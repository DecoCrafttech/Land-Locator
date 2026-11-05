import { z } from 'zod';
import {boundaryError,measuredArea} from './boundary';
export {boundaryError} from './boundary';
export type {BoundaryPoint} from './boundary';
export const kinds = ['Sale','Rent','Lease'] as const;
export const statuses = ['Draft','Available','Under Offer','Sold','Rented','Leased','Hidden','Expired'] as const;
export const categories = ['Residential Plot','Commercial Plot','Agricultural Land','Industrial Land','House','Other Property'] as const;
export const facilityCategories = ['Commute','Education','Healthcare','Shopping','Food','Essentials'] as const;
export const pointSchema = z.object({lat:z.number().min(-90).max(90),lng:z.number().min(-180).max(180)});
export const boundarySchema=z.array(pointSchema).max(100).superRefine((points,ctx)=>{const error=boundaryError(points);if(error)ctx.addIssue({code:'custom',message:error});});
export const propertySchema = z.object({title:z.string().min(5).max(120),description:z.string().min(15).max(5000),kind:z.enum(kinds),category:z.enum(categories),price:z.number().positive().max(1e12),period:z.enum(['total','month','year']).default('total'),area:z.number().positive().max(1e9),unit:z.enum(['sq.ft','sq.m','cent','acre','ground']).default('sq.ft'),locality:z.string().min(2).max(120),city:z.string().min(2).default('Coimbatore'),state:z.string().default('Tamil Nadu'),lat:z.number().min(-90).max(90),lng:z.number().min(-180).max(180),exactLocation:z.boolean().default(true),status:z.enum(statuses).default('Draft'),photos:z.array(z.string().max(1000)).max(12).default([]),reelUrl:z.union([z.literal(''),z.url().refine(v=>new URL(v).hostname==='www.instagram.com'||new URL(v).hostname==='instagram.com','Use an Instagram URL')]).default(''),boundary:boundarySchema.default([]),features:z.record(z.string(),z.string().max(200)).default({}),global:z.boolean().default(true),featured:z.boolean().default(false)});
export type PropertyInput=z.infer<typeof propertySchema>;
export function parsePropertyPatch(input:unknown):Partial<PropertyInput>{const original=z.record(z.string(),z.unknown()).parse(input);const parsed=propertySchema.partial().parse(input);return Object.fromEntries(Object.entries(parsed).filter(([key])=>Object.hasOwn(original,key))) as Partial<PropertyInput>;}
export type Property=PropertyInput & {id:string;tenantId:string;demo:boolean;createdAt:string;updatedAt:string;confirmedAt:string|null};
export type Tenant={id:string;slug:string;name:string;color:string;description:string;phone:string;whatsapp:string;instagram:string;logo:string;active:boolean;plan:string};
export type User={id:string;email:string;name:string;role:'partner'|'admin';tenantId:string;passwordHash:string};
export const enquirySchema=z.object({propertyId:z.string().min(1),name:z.string().min(2).max(80),phone:z.string().regex(/^\+?[\d\s()-]{10,18}$/,'Enter a valid phone number'),message:z.string().min(5).max(2000),method:z.enum(['Phone','WhatsApp','Email']).default('Phone'),date:z.string().optional(),time:z.string().optional(),website:z.string().max(0).optional()});
export type Enquiry=z.infer<typeof enquirySchema>&{id:string;tenantId:string;createdAt:string;status:'New'|'Contacted'|'Site Visit Planned'|'Closed'};
export type Facility={id:string;name:string;category:typeof facilityCategories[number];lat:number;lng:number;distance:number|null;seconds:number|null;straightLine:number;demo:boolean};
export const factors={'sq.ft':1,'sq.m':10.76391041671,cent:435.6,acre:43560,ground:2400};
export function areaSqft(value:number,unit:keyof typeof factors,ground=2400){return value*(unit==='ground'?ground:factors[unit]);}
export function money(value:number,period='total'){const n=value>=1e7?`${(value/1e7).toFixed(2).replace(/\.00$/,'')} Cr`:value>=1e5?`${(value/1e5).toFixed(1).replace(/\.0$/,'')} L`:value.toLocaleString('en-IN');return `₹${n}${period==='total'?'':` / ${period}`}`;}
export function distance(m:number|null){return m===null?'Unavailable':m<1000?`${Math.round(m)} m`:`${(m/1000).toFixed(1)} km`;}
export function haversine(a:{lat:number;lng:number},b:{lat:number;lng:number}){const r=Math.PI/180,dlat=(b.lat-a.lat)*r,dlng=(b.lng-a.lng)*r;return 6371008.8*2*Math.asin(Math.sqrt(Math.sin(dlat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dlng/2)**2));}
export const polygonArea=measuredArea;
export type Filters={q?:string;kind?:string;category?:string;minPrice?:number;maxPrice?:number;minArea?:number;maxArea?:number;bounds?:number[];tenantId?:string;recent?:boolean;road?:boolean};
export function matches(p:Property,f:Filters){const a=areaSqft(p.area,p.unit);return ['Available','Under Offer'].includes(p.status)&&(!f.tenantId||p.tenantId===f.tenantId)&&(f.tenantId||p.global)&&(!f.q||`${p.title} ${p.locality} ${p.city} ${p.id}`.toLowerCase().includes(f.q.toLowerCase()))&&(!f.kind||p.kind===f.kind)&&(!f.category||p.category===f.category)&&(f.minPrice==null||p.price>=f.minPrice)&&(f.maxPrice==null||p.price<=f.maxPrice)&&(f.minArea==null||a>=f.minArea)&&(f.maxArea==null||a<=f.maxArea)&&(!f.bounds||(p.lng>=f.bounds[0]&&p.lat>=f.bounds[1]&&p.lng<=f.bounds[2]&&p.lat<=f.bounds[3]))&&(!f.recent||Date.now()-Date.parse(p.createdAt)<30*86400000)&&(!f.road||!!p.features['Road access']);}
