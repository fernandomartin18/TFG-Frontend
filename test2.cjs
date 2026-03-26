const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  await page.goto('http://localhost:5174/');
  await page.waitForTimeout(2000);
  console.log('Clicking button...');
  await page.click('button[title="Crear diagrama PlantUML"]');
  await page.waitForTimeout(2000);
  console.log('Page content after click:');
  const html = await page.content();
  console.log(html.substring(0, 500));
  const root = await page.innerHTML('#root');
  console.log('ROOT HTML:', root.substring(0, 500));
  await browser.close();
})();
