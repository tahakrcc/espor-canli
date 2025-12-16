const http = require('http');

const url = "http://localhost:3001/uploads/videos/1- Anladın mı.mp4";
// encode it just in case node http needs it, but browser would send encoded
const encodedUrl = "http://localhost:3001/uploads/videos/1-%20Anlad%C4%B1n%20m%C4%B1.mp4";

console.log("Checking:", encodedUrl);

http.get(encodedUrl, (res) => {
    console.log('Status Code:', res.statusCode);
    res.resume();
}).on('error', (e) => {
    console.error('Error:', e.message);
});
