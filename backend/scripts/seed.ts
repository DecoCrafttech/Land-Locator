import {demo} from '../src/config';
import {initStore,putProperty,putTenant} from '../src/store';
import {demoProperties,demoTenants} from '../src/seed';
if(!demo)throw new Error('Demo seeding is disabled in production data mode.');
await initStore();for(const t of demoTenants)await putTenant(t);for(const p of demoProperties)await putProperty(p);console.log('Sample Coimbatore properties seeded.');
