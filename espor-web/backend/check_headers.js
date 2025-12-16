const http = require('http');

const options = {
    method: 'HEAD',
    host: 'localhost',
    port: 3001,
    path: '/uploads/videos/video_1.mp4'
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers, null, 2)}`);
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
