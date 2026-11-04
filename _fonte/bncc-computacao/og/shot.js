const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1100,height:900},deviceScaleFactor:2});
await p.goto('http://localhost:8771/infograficos/bncc-computacao/');await p.waitForTimeout(800);
await p.locator('#g-rede .no').nth(10).click();await p.waitForTimeout(300);
await p.locator('#g-rede').screenshot({path:'rede.png'});

await b.close();})();
