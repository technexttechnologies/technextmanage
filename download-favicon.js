const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1776917252/Untitled-2_gx7mta.png';
const dest = path.join(__dirname, 'src', 'app', 'icon.png');
const oldFavicon = path.join(__dirname, 'src', 'app', 'favicon.ico');

https.get(url, (res) => {
  const fileStream = fs.createWriteStream(dest);
  res.pipe(fileStream);
  fileStream.on('finish', () => {
    fileStream.close();
    console.log('Downloaded icon.png');
    if (fs.existsSync(oldFavicon)) {
      fs.unlinkSync(oldFavicon);
      console.log('Deleted old favicon.ico');
    }
  });
}).on('error', (err) => {
  console.error('Error downloading:', err.message);
});
