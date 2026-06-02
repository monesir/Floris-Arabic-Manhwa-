const https = require('https');
https.get('https://olympustaff.com/', res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const m = data.match(/href=\"(https:\/\/olympustaff\.com\/series\/[^\"]+)\"/);
    if (m) {
      console.log('Fetching', m[1]);
      https.get(m[1], res2 => {
        let data2 = '';
        res2.on('data', c => data2 += c);
        res2.on('end', () => {
          require('fs').writeFileSync('olympus_dump.html', data2);
          console.log('Saved to olympus_dump.html');
        });
      });
    } else {
      console.log('No series found');
    }
  });
});
