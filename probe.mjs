import { chromium } from 'playwright';
const url = 'http://localhost:5199/kopertina';
const browser = await chromium.launch();
const page = await browser.newPage();
page.setDefaultTimeout(20000);
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.locator('#book-cover').waitFor({ state: 'visible' });

const T = '#book-cover .title[contenteditable]';
const read = async () => JSON.stringify(await page.locator(T).innerText());
const set = async (sel, v) => page.locator(sel).evaluate((el, x) => {
  el.innerText = x; el.dispatchEvent(new InputEvent('input', { bubbles: true }));
}, v);

await page.locator('.theme-btn[data-id="modern"]').click();
await page.locator('.palette[data-id="classic"]').click();
await page.locator('.font[data-id="instrumentSerif"]').click();
console.log('after theme/palette/font clicks:', await read());

await set(T, 'Lotët e dashtniës');
await set('#book-cover .subtitle[contenteditable]', 'Vjersha dashtnore');
await set('#book-cover .author[contenteditable]', 'HIL MOSI');
console.log('after three sets:            ', await read());

for (const [id, v] of [['title-size', 4], ['subtitle-size', 0.95], ['author-size', 1.05]]) {
  await page.locator(`#${id}`).evaluate((el, x) => {
    el.value = String(x); el.dispatchEvent(new Event('input', { bubbles: true }));
  }, v);
  console.log(`  after #${id}:`.padEnd(30), await read());
}

await page.evaluate(() => document.activeElement?.blur());
console.log('after blur:                  ', await read());
await browser.close();
