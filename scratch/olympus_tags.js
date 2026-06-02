const cheerio = require('cheerio');
fetch('https://olympustaff.com/series/manager-kim').then(res => res.text()).then(html => {
  const $ = cheerio.load(html);
  const genres = [];
  $('.full-list-info').each((i, el) => {
    console.log('Found full-list-info:', $(el).text().trim().replace(/\s+/g, ' '));
  });
  
  // Also check if tags are somewhere else
  $('.sgeneres a, .genres a, .mgen a').each((i, el) => {
    console.log('Found tag a:', $(el).text().trim());
  });
});
