const fs = require('fs');
const html = fs.readFileSync('olympus_dump.html', 'utf8');
const cheerio = require('./apps/desktop/node_modules/cheerio');
const $ = cheerio.load(html);

$('a').each((i, el) => {
  const text = $(el).text().trim();
  if(text.match(/(اكشن|أكشن|سحر|خيال|مغامر|رومانس)/)) {
    console.log('Tag found:', text, 'Class:', $(el).attr('class'), 'Parent:', $(el).parent().attr('class'));
  }
});
