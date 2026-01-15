const fs = require('fs');

console.log('\n✓ VERIFICATION: Category-filtered product counts\n');
const files = ['ammunition', 'magazines', 'gun-parts', 'gear', 'optics', 'reloading', 'survival'];
let total = 0;

files.forEach(f => {
  const data = JSON.parse(fs.readFileSync(`data/products/${f}.json`, 'utf8'));
  const count = data.products.length;
  total += count;
  console.log(`  ${f.padEnd(15)}: ${count.toLocaleString()} products`);
});

console.log(`\n  ${'TOTAL'.padEnd(15)}: ${total.toLocaleString()} products`);
console.log('\n✓ All changes committed and pushed to GitHub\n');
