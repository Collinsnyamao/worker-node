const config = require('./config/config');
const { connect, disconnect } = require('./services/websocket');
const { registerCommandHandler } = require('./services/commands');

// Display startup message
console.log('=========================================');
console.log(`Worker Node: ${config.nodeId}`);
console.log(`Environment: ${config.env}`);
console.log(`Sentinel URL: ${config.sentinel.url}`);
console.log('=========================================');

// Connect to sentinel server
connect();

// Handle process termination
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Graceful shutdown
function shutdown() {
    console.log('Worker node shutting down');
    disconnect();

    // Exit after a short delay
    setTimeout(() => {
        process.exit(0);
    }, 1000);
}

// Example of registering a custom command
// registerCommandHandler('custom-command', async (params) => {
//   return { result: 'Custom command executed' };
// });

console.log('Worker node initialization complete');