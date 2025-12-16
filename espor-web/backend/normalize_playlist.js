const fs = require('fs');
const path = require('path');

const playlistPath = path.join(__dirname, 'src/utils/playlist.json');
const videosDir = path.join(__dirname, 'public/uploads/videos');
const thumbsDir = path.join(__dirname, 'public/uploads/thumbnails');

try {
    const playlist = JSON.parse(fs.readFileSync(playlistPath, 'utf8'));
    const videoFiles = fs.readdirSync(videosDir);
    const thumbFiles = fs.readdirSync(thumbsDir);

    let updatedCount = 0;

    const normalizedPlaylist = playlist.map(item => {
        const newItem = { ...item };

        // --- Fix Video URL ---
        // Get just the filename (decode it first to handle existing encoded URLs)
        let videoFilename = path.basename(decodeURIComponent(item.url));

        // Find exact match in directory
        const exactVideo = videoFiles.find(f => f.toLowerCase() === videoFilename.toLowerCase() || f.trim() === videoFilename.trim());

        if (exactVideo) {
            // Use local relative path
            newItem.url = `/uploads/videos/${exactVideo}`;
            if (newItem.url !== item.url) updatedCount++;
        } else {
            console.warn(`WARNING: Video not found for "${item.title}": ${videoFilename}`);
        }

        // --- Fix Thumbnail URL ---
        if (item.thumbnailUrl) {
            let thumbFilename = path.basename(decodeURIComponent(item.thumbnailUrl));
            const exactThumb = thumbFiles.find(f => f.toLowerCase() === thumbFilename.toLowerCase() || f.trim() === thumbFilename.trim());

            if (exactThumb) {
                newItem.thumbnailUrl = `/uploads/thumbnails/${exactThumb}`;
            }
        }

        return newItem;
    });

    fs.writeFileSync(playlistPath, JSON.stringify(normalizedPlaylist, null, 2));
    console.log(`Playlist normalized. Updated ${updatedCount} items.`);

} catch (err) {
    console.error('Error normalizing playlist:', err);
}
