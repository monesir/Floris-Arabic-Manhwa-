const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('olympus_dump.html', 'utf-8');
const $ = cheerio.load(html);

console.log('--- .full-list-info items ---');
$('.full-list-info').each((i, el) => {
  console.log('Item:', $(el).text().trim().replace(/\s+/g, ' '));
});

console.log('\n--- .sgeneres a, .genres a, .mgen a, .seriestugenre a ---');
$('.sgeneres a, .genres a, .mgen a, .seriestugenre a').each((i, el) => {
  console.log('Tag:', $(el).text().trim());
});

console.log('\n--- Any other potential tags element ---');
$('.ts-info .imptdt').each((i, el) => {
  console.log('ts-info:', $(el).text().trim().replace(/\s+/g, ' '));
});
