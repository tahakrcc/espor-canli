const fs = require('fs');
const path = require('path');

// In-memory state (RESET on server restart, good enough for live events)
const videoState = {
    currentVideoUrl: '', // URL or path to file
    currentThumbnailUrl: '', // URL for the thumbnail
    isPlaying: false,
    currentTime: 0,
    volume: 100, // Volume 0-100
    lastUpdateTimestamp: Date.now(),
    playlist: [] // Array of { title, url, type }
};

function getVideoState() {
    const now = Date.now();
    if (videoState.isPlaying) {
        // Estimate current time based on lag
        const elapsed = (now - videoState.lastUpdateTimestamp) / 1000;
        return {
            ...videoState,
            estimatedTime: videoState.currentTime + elapsed
        };
    }
    return { ...videoState, estimatedTime: videoState.currentTime };
}

function updateVideoState(newState) {
    if (newState.isPlaying !== undefined) videoState.isPlaying = newState.isPlaying;
    if (newState.currentTime !== undefined) videoState.currentTime = newState.currentTime;
    if (newState.currentVideoUrl !== undefined) videoState.currentVideoUrl = newState.currentVideoUrl;
    if (newState.currentThumbnailUrl !== undefined) videoState.currentThumbnailUrl = newState.currentThumbnailUrl;

    videoState.lastUpdateTimestamp = Date.now();
}

module.exports = {
    videoState,
    getVideoState,
    updateVideoState
};
