const fs = require('fs');
const csv = require('csv-parser');

const categories = new Set();

fs.createReadStream('../data/Chattanooga - itemInventory (4).csv')
  .pipe(csv())
  .on('data', (row) => {
    if (row.Category && row.Category.trim()) {
      categories.add(row.Category.trim());
    }
  })
  .on('end', () => {
    console.log('Unique Categories:');
    Array.from(categories).sort().forEach(cat => console.log(cat));
    console.log(`\nTotal unique categories: ${categories.size}`);
  })
  .on('error', (err) => {
    console.error('Error reading CSV:', err);
  });