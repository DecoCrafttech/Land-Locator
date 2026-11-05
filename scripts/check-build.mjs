import {spawn} from 'node:child_process';
const child=spawn(process.execPath,['backend/dist/server.mjs'],{env:{...process.env,PORT:'4012',DEMO_MODE:'true'},stdio:['ignore','pipe','pipe']});
let checked=false;
const timeout=setTimeout(()=>{child.kill();process.exitCode=1;console.error('Compiled backend did not become ready.');},10000);
child.stdout.on('data',async data=>{if(String(data).includes('Land Locator API')&&!checked){checked=true;try{const r=await fetch('http://localhost:4012/api/config');if(!r.ok)throw new Error('Readiness failed');console.log('Compiled backend readiness: OK');}catch(e){console.error(e);process.exitCode=1;}finally{clearTimeout(timeout);child.kill();}}});
child.stderr.on('data',data=>process.stderr.write(data));child.on('exit',code=>{if(!checked&&code){clearTimeout(timeout);process.exitCode=1;}});
