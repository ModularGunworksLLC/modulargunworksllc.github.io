const fs = require('fs');
const path = require('path');

// Path to the CSV file
const csvPath = path.join(__dirname, 'data', 'Chattanooga - itemInventory (4).csv');

function analyzeCSV() {
    console.log('Analyzing Chattanooga CSV...\n');

    if (!fs.existsSync(csvPath)) {
        console.error('CSV file not found:', csvPath);
        return;
    }

    const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8' });
    let headers = [];
    let lineCount = 0;
    const categories = new Set();
    const departments = new Set();
    let sampleRows = [];

    let buffer = '';
    fileStream.on('data', (chunk) => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line

        for (const line of lines) {
            lineCount++;
            const columns = parseCSVLine(line);

            if (lineCount === 1) {
                headers = columns;
                console.log('Headers:', headers);
                continue;
            }

            if (columns.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = columns[index];
                });

                // Collect categories and departments
                if (row['Category']) categories.add(row['Category']);
                if (row['Department']) departments.add(row['Department']);

                // Collect sample rows
                if (sampleRows.length < 5) {
                    sampleRows.push({
                        name: row['Item Name'] || row['Name'] || '',
                        category: row['Category'] || '',
                        department: row['Department'] || ''
                    });
                }
            }
        }
    });

    fileStream.on('end', () => {
        console.log(`\nProcessed ${lineCount} lines`);
        console.log(`Unique Categories: ${categories.size}`);
        console.log(`Unique Departments: ${departments.size}`);

        console.log('\n=== SAMPLE ROWS ===');
        sampleRows.forEach((row, i) => {
            console.log(`${i+1}. Name: ${row.name}`);
            console.log(`   Category: ${row.category}`);
            console.log(`   Department: ${row.department}\n`);
        });

        console.log('\n=== UNIQUE CATEGORIES ===');
        Array.from(categories).sort().forEach(cat => console.log(`- "${cat}"`));

        console.log('\n=== UNIQUE DEPARTMENTS ===');
        Array.from(departments).sort().forEach(dept => console.log(`- "${dept}"`));
    });

    fileStream.on('error', (err) => {
        console.error('Error reading CSV:', err);
    });
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

analyzeCSV();