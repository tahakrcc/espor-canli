const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '../import_queue');
const VIDEOS_DIR = path.join(__dirname, '../public/uploads/videos');
const THUMBNAILS_DIR = path.join(__dirname, '../public/uploads/thumbnails');
const PLAYLIST_FILE = path.join(__dirname, '../src/utils/playlist.json');

// Ensure directories exist (redundant check but safe)
[VIDEOS_DIR, THUMBNAILS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function importAssets() {
    try {
        const files = fs.readdirSync(SOURCE_DIR);
        const processingMap = new Map();

        // Group by base name (without extension)
        files.forEach(file => {
            const ext = path.extname(file).toLowerCase();
            const baseName = path.basename(file, ext);

            if (!processingMap.has(baseName)) {
                processingMap.set(baseName, {});
            }

            if (['.mp4', '.webm', '.mov'].includes(ext)) {
                processingMap.get(baseName).video = file;
            } else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
                processingMap.get(baseName).thumbnail = file;
            }
        });

        const playlist = [];
        const validPairs = [];

        for (const [name, assets] of processingMap) {
            if (assets.video && assets.thumbnail) {
                validPairs.push({ name, ...assets });
            } else {
                console.warn(`⚠️ Incomplete pair for "${name}": Video=${assets.video}, Thumb=${assets.thumbnail}`);
            }
        }

        console.log(`Creating entries for ${validPairs.length} valid pairs...`);

        // Process valid pairs
        for (const pair of validPairs) {
            const videoSrc = path.join(SOURCE_DIR, pair.video);
            const thumbSrc = path.join(SOURCE_DIR, pair.thumbnail);

            const videoDest = path.join(VIDEOS_DIR, pair.video);
            const thumbDest = path.join(THUMBNAILS_DIR, pair.thumbnail);

            // Copy files (using copy instead of move for safety in this iteration, or move if preferred)
            // Let's MOVE them to clear the queue
            fs.renameSync(videoSrc, videoDest);
            fs.renameSync(thumbSrc, thumbDest);

            // Add to playlist
            playlist.push({
                id: pair.name, // using filename as ID
                title: pair.name.replace(/^\d+[- ]+/, '').trim(), // Remove leading "1- "
                videoUrl: `/uploads/videos/${pair.video}`,
                thumbnailUrl: `/uploads/thumbnails/${pair.thumbnail}`,
                type: 'file'
            });
        }

        // Sort by the number at the start of the filename if possible
        playlist.sort((a, b) => {
            const numA = parseInt(a.id.match(/^\d+/)?.[0] || '0');
            const numB = parseInt(b.id.match(/^\d+/)?.[0] || '0');
            return numA - numB;
        });

        // Write playlist
        fs.writeFileSync(PLAYLIST_FILE, JSON.stringify(playlist, null, 2));
        console.log(`✅ Imported ${playlist.length} items. Playlist saved to ${PLAYLIST_FILE}`);

    } catch (error) {
        console.error('Import failed:', error);
    }
}

importAssets();
