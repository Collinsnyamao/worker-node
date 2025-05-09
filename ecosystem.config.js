module.exports = {
    apps: [{
        name: 'worker-node',
        script: 'app.js',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '500M',
        env: {
            NODE_ENV: 'production',
            NODE_ID: 'worker-prod',
            NODE_NAME: 'Production Worker',
            SENTINEL_URL: 'ws://13.219.98.175:3000/ws/node',
            NODE_SECRET: 'tZHR/XM3wFQZ9NAYjXCgjLtznD16SQY+K1mY+BW37QI=',
            RECONNECT_INTERVAL: '5000',
            HEARTBEAT_INTERVAL: '30000'
        },
        output: 'logs/out.log',  // Capture console.log output
        error: 'logs/error.log', // Capture console.error output
    }]
};