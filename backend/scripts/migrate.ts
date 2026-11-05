import '../src/config';
import {drizzle} from 'drizzle-orm/neon-http';
import {migrate} from 'drizzle-orm/neon-http/migrator';
if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL to run PostgreSQL migrations. Demo mode uses its local store.');
await migrate(drizzle(process.env.DATABASE_URL),{migrationsFolder:'./migrations'});
console.log('Migrations applied.');
