const fs = require('fs');
const html = fs.readFileSync('olympus_dump.html', 'utf-8');

// Find all elements that might contain tags, like links inside some div.
const matches = html.match(/<a[^>]*>(.*?)<\/a>/g);
if (matches) {
  matches.forEach(m => {
    if (m.includes('أكشن') || m.includes('اكشن') || m.includes('مغامر') || m.includes('خيال')) {
      console.log('Found tag link:', m);
    }
  });
}

// Find anything containing اكشن
const lines = html.split('\n');
lines.forEach((line, i) => {
  if (line.includes('اكشن') || line.includes('أكشن') || line.includes('مغامر')) {
    console.log(`Line ${i}:`, line.trim());
  }
});
