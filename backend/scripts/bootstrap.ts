import '../src/config';
import {initStore,putUser,putTenant,userByEmail} from '../src/store';
import {randomUUID} from 'node:crypto';
import bcrypt from 'bcryptjs';
const email=process.env.BOOTSTRAP_EMAIL?.toLowerCase(),password=process.env.BOOTSTRAP_PASSWORD;
if(!email||!password||password.length<12)throw new Error('Set BOOTSTRAP_EMAIL and BOOTSTRAP_PASSWORD (12+ characters).');
await initStore();if(await userByEmail(email))throw new Error('This account already exists.');
const id=randomUUID();await putTenant({id,slug:'land-locator-team',name:'Land Locator Team',color:'#512DA8',description:'',phone:'',whatsapp:'',instagram:'',logo:'',active:true,plan:'platform'});await putUser({id:randomUUID(),tenantId:id,email,name:'Platform Admin',role:'admin',passwordHash:await bcrypt.hash(password,12)});console.log('Administrator created. Remove bootstrap credentials from your environment.');
