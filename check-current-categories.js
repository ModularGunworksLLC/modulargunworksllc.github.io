const fs = require('fs');

console.log('\n=== CURRENT CATEGORIZATION STATUS ===\n');

const files = ['ammunition.json', 'magazines.json', 'reloading.json', 'gun-parts.json'];
files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(`data/products/${file}`, 'utf8'));
  console.log(`\n${file}: ${data.products.length} items`);
  console.log('First 5 products:');
  data.products.slice(0, 5).forEach(p => {
    console.log(`  • ${p.name}`);
  });
});
