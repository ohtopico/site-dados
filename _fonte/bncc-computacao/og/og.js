const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:630}});
await p.goto('file://'+__dirname+'/og.html');await p.waitForTimeout(500);
await p.screenshot({path:'/home/claude/site-dados/infograficos/bncc-computacao/og-bncc-computacao.jpg',type:'jpeg',quality:88});await b.close();})();
