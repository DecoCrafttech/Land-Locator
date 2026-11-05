import './config';
import {demo} from './config';
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import bcrypt from 'bcryptjs';
import {drizzle} from 'drizzle-orm/neon-http';
import {and,eq,gte,lte,inArray,or,ilike,sql} from 'drizzle-orm';
import * as schema from './db/schema';
import {demoProperties,demoTenants} from './seed';
import {matches,type Property,type Tenant,type User,type Enquiry,type Filters} from '../../packages/shared/src/index';
type State={properties:Property[];tenants:Tenant[];users:User[];enquiries:Enquiry[];sessions:{id:string;userId:string;expiresAt:string;csrf:string}[];audit:unknown[];images:{id:string;tenantId:string;key:string;mime:string}[]};
const file=path.resolve(process.env.LAND_LOCATOR_DATA_DIR||path.resolve(import.meta.dirname,'../../data'),'demo.json');
export const db=process.env.DATABASE_URL?drizzle(process.env.DATABASE_URL,{schema}):null;
let state:State;let queue=Promise.resolve();
export async function initStore(){if(db)return;try{state=JSON.parse(await readFile(file,'utf8'));}catch{state={properties:demoProperties,tenants:demoTenants,users:[{id:'demo-user',tenantId:'demo-partner',email:'partner@demo.landlocator.test',name:'Demo Partner',role:'partner',passwordHash:await bcrypt.hash('LandLocator!2026',12)},{id:'demo-admin',tenantId:'demo-partner',email:'admin@demo.landlocator.test',name:'Demo Admin',role:'admin',passwordHash:await bcrypt.hash('LandLocator!2026',12)}],enquiries:[],sessions:[],audit:[],images:[]};await persist();}}
function persist(){queue=queue.then(async()=>{await mkdir(path.dirname(file),{recursive:true});await writeFile(file+'.tmp',JSON.stringify(state,null,2));await rename(file+'.tmp',file);});return queue;}
export async function getProperties(f:Filters={},privateTenant?:string){if(!db)return state.properties.filter(p=>privateTenant?p.tenantId===privateTenant:matches(p,f));const clauses=[];if(privateTenant)clauses.push(eq(schema.properties.tenantId,privateTenant));else{clauses.push(inArray(schema.properties.status,['Available','Under Offer']),eq(schema.properties.demo,demo));if(f.tenantId)clauses.push(eq(schema.properties.tenantId,f.tenantId));else clauses.push(eq(schema.properties.global,true));if(f.bounds)clauses.push(gte(schema.properties.lng,f.bounds[0]),gte(schema.properties.lat,f.bounds[1]),lte(schema.properties.lng,f.bounds[2]),lte(schema.properties.lat,f.bounds[3]));if(f.kind)clauses.push(eq(schema.properties.kind,f.kind));if(f.q)clauses.push(or(ilike(schema.properties.id,`%${f.q}%`),sql`${schema.properties.data}->>'title' ILIKE ${'%'+f.q+'%'}`,sql`${schema.properties.data}->>'locality' ILIKE ${'%'+f.q+'%'}`)!);}const rows=await db.select().from(schema.properties).where(and(...clauses)).limit(2000);const ps=rows.map(r=>r.data as Property);return privateTenant?ps:ps.filter(p=>matches(p,f));}
export async function getProperty(id:string){if(!db)return state.properties.find(p=>p.id===id);return (await db.select().from(schema.properties).where(eq(schema.properties.id,id)))[0]?.data as Property|undefined;}
export async function putProperty(p:Property){if(db)await db.insert(schema.properties).values({id:p.id,tenantId:p.tenantId,lat:p.lat,lng:p.lng,status:p.status,kind:p.kind,global:p.global,demo:p.demo,data:p}).onConflictDoUpdate({target:schema.properties.id,set:{lat:p.lat,lng:p.lng,status:p.status,kind:p.kind,global:p.global,data:p}});else{state.properties=state.properties.filter(v=>v.id!==p.id).concat(p);await persist();}}
export async function tenants(){if(!db)return state.tenants;return (await db.select().from(schema.tenants)).map(r=>r.data as Tenant);}
export async function putTenant(t:Tenant){if(db)await db.insert(schema.tenants).values({id:t.id,slug:t.slug,name:t.name,active:t.active,plan:t.plan,data:t}).onConflictDoUpdate({target:schema.tenants.id,set:{slug:t.slug,name:t.name,active:t.active,plan:t.plan,data:t}});else{state.tenants=state.tenants.filter(v=>v.id!==t.id).concat(t);await persist();}}
export async function userByEmail(email:string){if(!db)return state.users.find(u=>u.email===email);return (await db.select().from(schema.users).where(eq(schema.users.email,email)))[0] as User|undefined;}
export async function userById(id:string){if(!db)return state.users.find(u=>u.id===id);return (await db.select().from(schema.users).where(eq(schema.users.id,id)))[0] as User|undefined;}
export async function putUser(u:User){if(db)await db.insert(schema.users).values(u).onConflictDoUpdate({target:schema.users.id,set:{passwordHash:u.passwordHash}});else{state.users=state.users.filter(v=>v.id!==u.id).concat(u);await persist();}}
export async function createSession(userId:string){const s={id:randomUUID()+randomUUID(),userId,expiresAt:new Date(Date.now()+7*86400000).toISOString(),csrf:randomUUID()};if(db)await db.insert(schema.sessions).values({...s,expiresAt:new Date(s.expiresAt)});else{state.sessions.push(s);await persist();}return s;}
export async function getSession(id:string){const s=db?(await db.select().from(schema.sessions).where(eq(schema.sessions.id,id)))[0]:state.sessions.find(s=>s.id===id);return s&&new Date(s.expiresAt)>new Date()?s:undefined;}
export async function deleteSession(id:string){if(db)await db.delete(schema.sessions).where(eq(schema.sessions.id,id));else{state.sessions=state.sessions.filter(s=>s.id!==id);await persist();}}
export async function getEnquiries(tenantId?:string){if(!db)return state.enquiries.filter(e=>!tenantId||e.tenantId===tenantId);return (await db.select().from(schema.enquiries).where(tenantId?eq(schema.enquiries.tenantId,tenantId):undefined)).map(r=>r.data as Enquiry);}
export async function putEnquiry(e:Enquiry){if(db)await db.insert(schema.enquiries).values({id:e.id,tenantId:e.tenantId,propertyId:e.propertyId,data:e}).onConflictDoUpdate({target:schema.enquiries.id,set:{data:e}});else{state.enquiries=state.enquiries.filter(v=>v.id!==e.id).concat(e);await persist();}}
export async function audit(user:User,action:string,propertyId?:string){const a={id:randomUUID(),userId:user.id,tenantId:user.tenantId,action,propertyId,createdAt:new Date()};if(db)await db.insert(schema.auditLogs).values(a);else{state.audit.push(a);await persist();}}
export async function addImage(i:{id:string;tenantId:string;key:string;mime:string}){if(db)await db.insert(schema.images).values(i);else{state.images.push(i);await persist();}}
export async function getImage(id:string){if(db)return (await db.select().from(schema.images).where(eq(schema.images.id,id)))[0];return state.images.find(i=>i.id===id);}
