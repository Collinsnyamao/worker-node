const os = require('os');
const { getIpAddress, getDiskInfo } = require('../utils/system');

/**
 * Get system metrics
 */
exports.getMetrics = async () => {
    try {
        // Calculate memory usage
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

        // Get CPU usage
        const loadAvg = os.loadavg();
        const cpuCount = os.cpus().length;
        const cpuUsage = Math.min((loadAvg[0] / cpuCount) * 100, 100);

        // Get disk usage
        const diskInfo = await getDiskInfo();
        const rootDisk = diskInfo.find(disk => disk.mounted === '/') || diskInfo[0];
        const diskUsage = rootDisk ? parseFloat(rootDisk.usedPercentage) : 0;

        return {
            timestamp: new Date().toISOString(),
            cpuUsage,
            memoryUsage,
            diskUsage,
            loadAvg: loadAvg,
            uptime: os.uptime(),
            ip: getIpAddress()
        };
    } catch (error) {
        console.error(`Error collecting metrics: ${error.message}`);

        // Return fallback metrics
        return {
            timestamp: new Date().toISOString(),
            cpuUsage: 0,
            memoryUsage: 0,
            diskUsage: 0,
            loadAvg: [0, 0, 0],
            uptime: os.uptime(),
            ip: getIpAddress()
        };
    }
};