const fs = require('fs');
const path = require('path');

const playlistPath = path.join(__dirname, 'src/utils/playlist.json');
const videosDir = path.join(__dirname, 'public/uploads/videos');

try {
    const playlist = JSON.parse(fs.readFileSync(playlistPath, 'utf8'));
    const files = fs.readdirSync(videosDir);

    console.log(`Playlist items: ${playlist.length}`);
    console.log(`Files on disk: ${files.length}`);

    const missing = [];
    const mismatches = [];

    playlist.forEach(item => {
        // Extract filename from URL
        // URL format: http://localhost:3001/uploads/videos/FILENAME
        const urlParts = item.url.split('/uploads/videos/');
        if (urlParts.length < 2) {
            console.log(`Skipping invalid URL format: ${item.url}`);
            return;
        }

        let filename = decodeURIComponent(urlParts[1]); // decode in case it was stored encoded

        // Exact match check
        if (!files.includes(filename)) {
            // content of files:
            // try to find a case-insensitive match or match ignoring spaces
            const looseMatch = files.find(f => f.toLowerCase() === filename.toLowerCase() || f.trim() === filename.trim());

            if (looseMatch) {
                mismatches.push({ expected: filename, found: looseMatch });
            } else {
                // Try checking if it was stored WITHOUT decoding in the JSON? 
                // e.g. "1-%20Anlad%C4%B1n%20m%C4%B1.mp4"
                const rawFilename = urlParts[1];
                if (files.includes(rawFilename)) {
                    // The file exists but the JSON has it encoded. 
                    // This is actually fine for the browser, but good to know.
                } else {
                    missing.push(filename);
                }
            }
        }
    });

    if (missing.length > 0) {
        console.log('\nMISSING FILES (Not found on disk):');
        missing.forEach(m => console.log(`- ${m}`));
    } else {
        console.log('\nNo completely missing files.');
    }

    if (mismatches.length > 0) {
        console.log('\nPOSSIBLE MISMATCHES (Case/Space differences):');
        mismatches.forEach(m => console.log(`- Expected: "${m.expected}" -> Found: "${m.found}"`));
    }

} catch (err) {
    console.error('Error running check:', err);
}
