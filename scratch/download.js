const https = require('https');
https.get('https://olympustaff.com/series/manager-kim', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const fs = require('fs');
    fs.writeFileSync('olympus_dump.html', data);
    console.log('Done downloading HTML to olympus_dump.html');
  });
});
