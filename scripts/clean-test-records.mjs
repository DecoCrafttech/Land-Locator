// Local demo only. Stop the API before running so in-memory state cannot overwrite the cleaned file.
import fs from 'node:fs/promises';
const file=new URL('../data/demo.json',import.meta.url);
const state=JSON.parse(await fs.readFile(file,'utf8'));
const tenantIds=new Set(state.tenants.filter(t=>/^browser-estates-\d+$/.test(t.slug)).map(t=>t.id));
const removed=new Set(state.properties.filter(p=>tenantIds.has(p.tenantId)||['Browser workflow plot','API test plot','Updated test plot'].includes(p.title)||p.id.startsWith('privacy-')).map(p=>p.id));
state.properties=state.properties.filter(p=>!removed.has(p.id));
state.tenants=state.tenants.filter(t=>!tenantIds.has(t.id));
const userIds=new Set(state.users.filter(u=>tenantIds.has(u.tenantId)).map(u=>u.id));
state.users=state.users.filter(u=>!userIds.has(u.id));
state.sessions=state.sessions.filter(s=>!userIds.has(s.userId));
state.enquiries=state.enquiries.filter(e=>!removed.has(e.propertyId)&&!['Browser Test','Integration Test'].includes(e.name));
state.audit=state.audit.filter(a=>!removed.has(a.propertyId)&&!userIds.has(a.userId));
await fs.writeFile(file,JSON.stringify(state,null,2));
console.log(`Removed ${removed.size} explicitly named automated-test listings from the local demo store.`);
