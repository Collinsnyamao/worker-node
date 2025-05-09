require('dotenv').config();
const os = require('os');
const crypto = require('crypto');

function generateUniqueId() {
    // Use hostname + random hex as a default ID
    const hostname = os.hostname().toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomPart = crypto.randomBytes(4).toString('hex');
    console.log('generating id ', `worker-${hostname}-${randomPart}`);
    return `worker-${hostname}-${randomPart}`;
}


module.exports = {
    // Worker identity
    nodeId: generateUniqueId(),
    nodeName: process.env.NODE_NAME || os.hostname(),

    // Environment
    env: process.env.NODE_ENV || 'development',

    // Sentinel connection
    sentinel: {
        url: process.env.SENTINEL_URL || 'ws://localhost:3000/ws/node',
        secret: process.env.NODE_SECRET || 'default_secret_key',
        reconnectInterval: parseInt(process.env.RECONNECT_INTERVAL || '5000'),
        heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || '30000')
    }
};