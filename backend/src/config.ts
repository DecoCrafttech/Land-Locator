import {config} from 'dotenv';
import path from 'node:path';
config({path:path.resolve(import.meta.dirname,'../../.env'),quiet:true});
export const demo=process.env.DEMO_MODE!=='false';
export const production=process.env.NODE_ENV==='production';
if(production&&process.env.DEMO_MODE!=='false')throw new Error('Production requires DEMO_MODE=false and configured services.');
export const origins=(process.env.ALLOWED_ORIGINS||'http://localhost:5183,http://localhost:5184').split(',');
if(!demo&&!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required outside demonstration mode');
