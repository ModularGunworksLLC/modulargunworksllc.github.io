// Scrapes category menus from PSA and Ammo Depot and outputs JSON files for comparison
// Usage: node scripts/scrape-retailer-categories.js

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const targets = [
  {
    name: 'psa',
    url: 'https://palmettostatearmory.com/',
    selector: '.nav-categories > li > a, .nav-categories > li > ul > li > a', // Main and subcategories
    output: path.join(__dirname, '../data/products/psa-categories.json'),
  },
  {
    name: 'ammodepot',
    url: 'https://www.ammodepot.com/',
    selector: '.nav > li > a, .nav > li > ul > li > a', // Main and subcategories
    output: path.join(__dirname, '../data/products/ammodepot-categories.json'),
  },
];

async function scrapeCategories(target) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(target.url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000); // Allow menus to load

  // Scrape category names
  const categories = await page.$$eval(target.selector, els =>
    els.map(e => e.textContent.trim()).filter(Boolean)
  );

  await browser.close();
  return categories;
}

(async () => {
  for (const target of targets) {
    try {
      console.log(`Scraping categories from ${target.url} ...`);
      const categories = await scrapeCategories(target);
      fs.writeFileSync(target.output, JSON.stringify(categories, null, 2));
      console.log(`Saved ${categories.length} categories to ${target.output}`);
    } catch (err) {
      console.error(`Error scraping ${target.name}:`, err);
    }
  }
})();
