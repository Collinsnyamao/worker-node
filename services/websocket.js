const WebSocket = require('ws');
const config = require('../config/config');
const { getMetrics } = require('./metrics');
const { getSystemInfo } = require('../utils/system');
const { executeCommand } = require('./commands');

let ws;
let reconnectTimer;
let heartbeatTimer;
let connectionRetries = 0;

/**
 * Connect to the Sentinel server
 */
exports.connect = () => {
    // Clear any existing timers
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (heartbeatTimer) clearTimeout(heartbeatTimer);

    const wsUrl = config.sentinel.url;
    console.log(`Connecting to sentinel: ${wsUrl}`);

    ws = new WebSocket(wsUrl, {
        headers: {
            'X-Node-Secret': config.sentinel.secret,
            'X-Node-ID': config.nodeId
        }
    });

    ws.on('open', async () => {
        connectionRetries = 0;
        console.log('Connected to sentinel server');

        // Send registration message
        try {
            const systemInfo = await getSystemInfo();

            sendMessage({
                type: 'register',
                nodeId: config.nodeId,
                name: config.nodeName,
                ip: systemInfo.network[0]?.interface || '127.0.0.1',
                tags: ['worker'],
                metadata: {
                    platform: systemInfo.platform,
                    distro: systemInfo.distro,
                    release: systemInfo.release,
                    kernel: systemInfo.kernel,
                    arch: systemInfo.arch,
                    cpu: systemInfo.cpu,
                    memory: systemInfo.memory
                },
                timestamp: new Date().toISOString()
            });

            console.log('Sent registration message');
        } catch (error) {
            console.error(`Error sending registration: ${error.message}`);
        }

        // Start sending heartbeats
        sendHeartbeat();
    });

    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data);
            console.log(`Received message: ${message.type}`);

            // Handle ping messages
            if (message.type === 'ping') {
                sendMessage({
                    type: 'pong',
                    timestamp: message.timestamp
                });
                console.log('Responded to ping');
            }

            // Handle command messages
            else if (message.type === 'command') {
                console.log(`Received command: ${message.command}`, message.parameters);

                try {
                    // Execute the command
                    const result = await executeCommand(message.command, message.parameters);

                    // Send response
                    sendMessage({
                        type: 'command_response',
                        commandId: message.commandId,
                        success: result.success,
                        result: result.success ? result.result : undefined,
                        error: result.success ? undefined : result.error,
                        timestamp: new Date().toISOString()
                    });

                    console.log(`Command response sent: ${message.command}`);
                } catch (error) {
                    console.error(`Error executing command: ${message.command} - ${error.message}`);

                    sendMessage({
                        type: 'command_response',
                        commandId: message.commandId,
                        success: false,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        } catch (error) {
            console.error(`Error processing message: ${error.message}`);
        }
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error: ${error.message}`);
    });

    ws.on('close', (code, reason) => {
        console.warn(`Disconnected from sentinel server. Code: ${code}, Reason: ${reason || 'Unknown'}`);

        // Schedule reconnection with backoff
        const delay = Math.min(
            config.sentinel.reconnectInterval * Math.pow(1.5, connectionRetries),
            60000 // Max 1 minute
        );

        connectionRetries++;

        console.log(`Scheduling reconnection in ${delay}ms (attempt ${connectionRetries})`);
        reconnectTimer = setTimeout(exports.connect, delay);
    });
};

/**
 * Send a message to the sentinel
 */
function sendMessage(message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        try {
            // For heartbeats, only log the type to avoid console spam
            if (message.type === 'heartbeat') {
                console.log(`Sending ${message.type} message`);
            } else {
                console.log(`Sending ${message.type} message:`, message);
            }

            ws.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error(`Error sending message: ${error.message}`);
            return false;
        }
    }
    return false;
}

/**
 * Send a heartbeat message
 */
async function sendHeartbeat() {
    try {
        if (ws && ws.readyState === WebSocket.OPEN) {
            const metrics = await getMetrics();

            sendMessage({
                type: 'heartbeat',
                nodeId: config.nodeId,
                ...metrics
            });
        }
    } catch (error) {
        console.error(`Error sending heartbeat: ${error.message}`);
    }

    // Schedule next heartbeat
    heartbeatTimer = setTimeout(sendHeartbeat, config.sentinel.heartbeatInterval);
}

/**
 * Send a log message to the sentinel
 */
exports.sendLog = (level, message, metadata = {}) => {
    sendMessage({
        type: 'log',
        level,
        message,
        timestamp: new Date().toISOString(),
        metadata
    });
};

/**
 * Check if connected to sentinel
 */
exports.isConnected = () => {
    return ws && ws.readyState === WebSocket.OPEN;
};

/**
 * Gracefully close the connection
 */
exports.disconnect = () => {
    if (heartbeatTimer) clearTimeout(heartbeatTimer);
    if (reconnectTimer) clearTimeout(reconnectTimer);

    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('Closing connection to sentinel');

        // Send offline status
        sendMessage({
            type: 'status',
            status: 'offline',
            timestamp: new Date().toISOString()
        });

        // Close after a short delay to allow message to be sent
        setTimeout(() => {
            ws.close();
        }, 500);
    }
};