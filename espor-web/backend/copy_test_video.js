const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'public/uploads/videos/1- Anladın mı.mp4');
const destPath = path.join(__dirname, 'public/uploads/videos/test.mp4');

try {
    fs.copyFileSync(srcPath, destPath);
    console.log('File copied successfully to test.mp4');
} catch (err) {
    console.error('Error copying file:', err);
}
