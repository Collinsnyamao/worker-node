require('dotenv').config();
const os = require('os');

module.exports = {
    // Worker identity
    nodeId: process.env.NODE_ID || `worker-${os.hostname().toLowerCase()}`,
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