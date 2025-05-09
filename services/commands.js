const { exec } = require('child_process');
const { promisify } = require('util');
const { getMetrics } = require('./metrics');
const { getSystemInfo, getDiskInfo } = require('../utils/system');

const execPromise = promisify(exec);

// Command handlers map
const commandHandlers = new Map();

/**
 * Register a command handler
 */
exports.registerCommandHandler = (commandType, handler) => {
    commandHandlers.set(commandType, handler);
    console.log(`Registered command handler for "${commandType}"`);
};

/**
 * Execute a command
 */
exports.executeCommand = async (commandType, parameters = {}) => {
    try {
        console.log(`Executing command: ${commandType}`, parameters);

        if (!commandHandlers.has(commandType)) {
            console.warn(`No handler registered for command type: ${commandType}`);
            return {
                success: false,
                error: `Unknown command type: ${commandType}`
            };
        }

        const handler = commandHandlers.get(commandType);
        const result = await handler(parameters);

        console.log(`Command executed successfully: ${commandType}`);
        return {
            success: true,
            result
        };
    } catch (error) {
        console.error(`Error executing command: ${commandType} - ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
};

// Register default command handlers
exports.registerCommandHandler('status', async () => {
    return await getMetrics();
});

exports.registerCommandHandler('system', async () => {
    return await getSystemInfo();
});

exports.registerCommandHandler('disk', async () => {
    return await getDiskInfo();
});

exports.registerCommandHandler('exec', async (params) => {
    if (!params.command) {
        throw new Error('No command specified');
    }

    const { stdout, stderr } = await execPromise(params.command);

    return {
        stdout,
        stderr
    };
});

exports.registerCommandHandler('restart', async () => {
    console.log('Restart command received, scheduling restart...');

    setTimeout(() => {
        process.exit(0);
    }, 1000);

    return { message: 'Restart scheduled' };
});

exports.registerCommandHandler('ping', async () => {
    return {
        pong: true,
        timestamp: new Date().toISOString()
    };
});