import {test,expect} from '@playwright/test';
import {networkInterfaces} from 'node:os';

const host=process.env.LAN_TEST_HOST||Object.values(networkInterfaces()).flat().find(v=>v?.family==='IPv4'&&!v.internal)?.address;
test('Add and Edit render on a plain HTTP LAN origin on desktop and mobile',async({page})=>{
  test.skip(!host,'No LAN IPv4 interface is available');
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  const origin=`http://${host}:5184`;
  await page.goto(origin);
  expect(await page.evaluate(()=>isSecureContext)).toBe(false);
  await page.getByRole('button',{name:'Use demo partner credentials',exact:true}).click();
  await page.getByRole('button',{name:'Sign in to your studio'}).click();
  await expect(page.getByRole('heading',{name:'Room for good things.'})).toBeVisible();
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:900});
    await page.goto(`${origin}/edit/LL-1001`);
    await expect(page.getByRole('heading',{name:'Give your listing a little care.'})).toBeVisible();
    await expect(page.getByLabel('Property title')).not.toHaveValue('');
    await page.getByRole('button',{name:'Continue',exact:true}).click();
    await expect(page.getByRole('heading',{name:'A place needs a pin.'})).toBeVisible();
    await page.goto(`${origin}/add`);
    await expect(page.getByRole('heading',{name:'Put your property on the map.'})).toBeVisible();
    await expect(page.getByLabel('Property title')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
});
