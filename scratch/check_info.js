const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('../../olympus_dump.html'));
$('.full-list-info').each((i, el) => {
  console.log('INFO:', $(el).text().trim());
});
