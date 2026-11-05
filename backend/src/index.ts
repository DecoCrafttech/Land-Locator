import {app} from './app';
import {initStore} from './store';
await initStore();
app.listen(Number(process.env.PORT)||4000,'0.0.0.0',()=>console.log('Land Locator API: http://localhost:'+(process.env.PORT||4000)));
