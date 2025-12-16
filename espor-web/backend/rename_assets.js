const fs = require('fs');
const path = require('path');

const playlistPath = path.join(__dirname, 'src/utils/playlist.json');
const videosDir = path.join(__dirname, 'public/uploads/videos');
const thumbsDir = path.join(__dirname, 'public/uploads/thumbnails');

try {
    const playlist = JSON.parse(fs.readFileSync(playlistPath, 'utf8'));
    const videoFiles = fs.readdirSync(videosDir);
    const thumbFiles = fs.readdirSync(thumbsDir);

    let updatedPlaylist = [];

    console.log('Starting Asset Sanitization...');

    playlist.forEach((item, index) => {
        const newItem = { ...item };
        const id = index + 1;

        // --- Process Video ---
        // Extract original logic to find file
        let videoFilename = path.basename(decodeURIComponent(item.url));
        // Find exact or fuzzy match
        let foundVideo = videoFiles.find(f => f.toLowerCase() === videoFilename.toLowerCase() || f.trim() === videoFilename.trim());

        if (foundVideo) {
            const ext = path.extname(foundVideo);
            const newVideoName = `video_${id}${ext}`; // e.g., video_1.mp4
            const oldPath = path.join(videosDir, foundVideo);
            const newPath = path.join(videosDir, newVideoName);

            if (oldPath !== newPath) {
                // Check if target already exists (idempotency)
                if (fs.existsSync(newPath)) {
                    console.log(`Target ${newVideoName} already exists, assuming already renamed.`);
                } else {
                    fs.renameSync(oldPath, newPath);
                    console.log(`Renamed Video: "${foundVideo}" -> "${newVideoName}"`);
                }
            }
            newItem.url = `/uploads/videos/${newVideoName}`;
        } else {
            console.warn(`⚠️ Video NOT FOUND for: ${item.title} (${videoFilename})`);
        }

        // --- Process Thumbnail ---
        if (item.thumbnailUrl) {
            let thumbFilename = path.basename(decodeURIComponent(item.thumbnailUrl));
            let foundThumb = thumbFiles.find(f => f.toLowerCase() === thumbFilename.toLowerCase() || f.trim() === thumbFilename.trim());

            if (foundThumb) {
                const ext = path.extname(foundThumb);
                const newThumbName = `thumb_${id}${ext}`; // e.g., thumb_1.png
                const oldPath = path.join(thumbsDir, foundThumb);
                const newPath = path.join(thumbsDir, newThumbName);

                if (oldPath !== newPath) {
                    if (fs.existsSync(newPath)) {
                        console.log(`Target ${newThumbName} already exists.`);
                    } else {
                        fs.renameSync(oldPath, newPath);
                        console.log(`Renamed Thumb: "${foundThumb}" -> "${newThumbName}"`);
                    }
                }
                newItem.thumbnailUrl = `/uploads/thumbnails/${newThumbName}`;
            } else {
                console.warn(`⚠️ Thumbnail NOT FOUND for: ${item.title}`);
            }
        }

        updatedPlaylist.push(newItem);
    });

    fs.writeFileSync(playlistPath, JSON.stringify(updatedPlaylist, null, 2));
    console.log('Playlist JSON updated with new paths.');
    console.log('Sanitization Complete!');

} catch (err) {
    console.error('Critical Error:', err);
}
