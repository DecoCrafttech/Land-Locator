import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
await fs.mkdir('artifacts',{recursive:true});
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
page.on('pageerror',error=>console.log('Browser error:',error.message));
await page.goto('http://localhost:5183');await page.waitForTimeout(3000);await page.screenshot({path:'artifacts/customer-desktop.png',fullPage:true});
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1000);await page.screenshot({path:'artifacts/customer-mobile.png',fullPage:true});
await page.goto('http://localhost:5183/property/LL-1001/nearby');await page.waitForTimeout(1500);await page.screenshot({path:'artifacts/nearby-mobile.png',fullPage:true});
await page.setViewportSize({width:1440,height:1000});await page.goto('http://localhost:5184');await page.getByRole('button',{name:'Use demo partner credentials',exact:true}).click();await page.getByRole('button',{name:'Sign in to your studio'}).click();await page.getByRole('heading',{name:'Room for good things.'}).waitFor();await page.screenshot({path:'artifacts/partner-desktop.png',fullPage:true});
for(const width of [320,360,390,430,768,1440]){await page.setViewportSize({width,height:900});for(const path of ['/','/add','/enquiries','/branding','/settings']){await page.goto(`http://localhost:5184${path}`);await page.waitForTimeout(150);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);if(overflow)throw new Error(`Partner overflow at ${width}px on ${path}`);}}
console.log('Partner responsive checks: 30 page/viewport combinations passed.');
await browser.close();
