const fs = require('fs');
const csv = require('csv-parser');

const mapping = {};

fs.createReadStream('../data/Chattanooga - itemInventory (4).csv')
  .pipe(csv())
  .on('data', (row) => {
    if (row.Category && row.Category.trim()) {
      const category = row.Category.trim();
      if (!mapping[category]) {
        // Determine site category based on category name
        let siteCategory = 'gear'; // default

        const cat = category.toUpperCase();

        // Ammunition
        if (cat.includes('AMMUNITION') || cat.startsWith('Ammunition|')) {
          siteCategory = 'ammunition';
        }
        // Reloading
        else if (cat.includes('RELOADING') || cat.startsWith('Reloading|') ||
                 cat.includes('BRASS') || cat.includes('PRIMER') || cat.includes('POWDER') ||
                 cat.includes('BULLET') || cat.includes('DIE') || cat.includes('PRESS')) {
          siteCategory = 'reloading';
        }
        // Magazines
        else if (cat.includes('MAGAZINE') || cat.startsWith('Handgun Magazines|') ||
                 cat.startsWith('Rifle Magazines|') || cat.startsWith('Shotgun Magazines|') ||
                 cat.includes('MAGAZINE ACCESSORIES')) {
          siteCategory = 'magazines';
        }
        // Optics
        else if (cat.includes('SCOPE') || cat.includes('OPTICS') || cat.startsWith('Optics|') ||
                 cat.includes('BINOCULAR') || cat.includes('SPOTTING SCOPE') ||
                 cat.includes('NIGHT VISION') || cat.includes('THERMAL')) {
          siteCategory = 'optics';
        }
        // Gun Parts
        else if (cat.includes('GUN PARTS') || cat.startsWith('Gun Parts|') ||
                 cat.includes('BARREL') || cat.includes('STOCK') || cat.includes('HANDGUARD') ||
                 cat.includes('TRIGGER') || cat.includes('UPPER') || cat.includes('LOWER') ||
                 cat.includes('RECEIVER') || cat.includes('CHASSIS') || cat.includes('GRIP') ||
                 cat.includes('MUZZLE DEVICE') || cat.includes('SUPPRESSOR')) {
          siteCategory = 'gun-parts';
        }
        // Outdoors
        else if (cat.includes('OUTDOORS') || cat.startsWith('Outdoors|') ||
                 cat.includes('HUNTING') || cat.includes('ARCHERY') || cat.includes('CAMPING') ||
                 cat.includes('BACKPACK') || cat.includes('CASE') || cat.includes('HOLSTER') ||
                 cat.includes('KNIFE') || cat.includes('FLASHLIGHT') || cat.includes('TACTICAL') ||
                 cat.includes('SHOOTING REST') || cat.includes('TARGET') || cat.includes('CLAY') ||
                 cat.includes('PERSONAL DEFENSE') || cat.includes('SAFETY')) {
          siteCategory = 'outdoors';
        }
        // Sale
        else if (cat.includes('SALE') || cat.includes('CLOSEOUT')) {
          siteCategory = 'sale';
        }

        mapping[category] = siteCategory;
      }
    }
  })
  .on('end', () => {
    console.log('chattanoogaToSiteMapping = {');
    Object.keys(mapping).sort().forEach(cat => {
      console.log(`  "${cat}": "${mapping[cat]}",`);
    });
    console.log('};');
  })
  .on('error', (err) => {
    console.error('Error reading CSV:', err);
  });