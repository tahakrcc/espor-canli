// Test WebSocket connection to backend
const io = require('socket.io-client');

console.log('Testing WebSocket connection...\n');

// Test 1: Root namespace
console.log('1. Testing root namespace (/)...');
const rootSocket = io('http://localhost:3001', {
    transports: ['websocket', 'polling']
});

rootSocket.on('connect', () => {
    console.log('✅ ROOT namespace connected!');
    console.log('   Socket ID:', rootSocket.id);
    rootSocket.disconnect();
});

rootSocket.on('connect_error', (err) => {
    console.log('❌ ROOT namespace connection error:', err.message);
});

// Test 2: Admin namespace
setTimeout(() => {
    console.log('\n2. Testing /admin namespace...');
    const adminSocket = io('http://localhost:3001/admin', {
        auth: { token: 'test-token' },
        transports: ['websocket', 'polling']
    });

    adminSocket.on('connect', () => {
        console.log('✅ ADMIN namespace connected!');
        console.log('   Socket ID:', adminSocket.id);
        adminSocket.disconnect();
        process.exit(0);
    });

    adminSocket.on('connect_error', (err) => {
        console.log('❌ ADMIN namespace connection error:', err.message);
        process.exit(1);
    });
}, 2000);

setTimeout(() => {
    console.log('\n⏱️ Timeout - no connection after 10 seconds');
    process.exit(1);
}, 10000);
