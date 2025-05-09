const os = require('os');
const si = require('systeminformation');
const nodeDiskInfo = require('node-disk-info');

/**
 * Get local IP address
 */
exports.getIpAddress = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
};

/**
 * Get system information
 */
exports.getSystemInfo = async () => {
    const cpu = await si.cpu();
    const mem = await si.mem();
    const osInfo = await si.osInfo();
    const network = await si.networkStats();

    return {
        hostname: os.hostname(),
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        kernel: osInfo.kernel,
        arch: osInfo.arch,
        cpu: {
            manufacturer: cpu.manufacturer,
            brand: cpu.brand,
            cores: cpu.cores,
            physicalCores: cpu.physicalCores
        },
        memory: {
            total: mem.total,
            free: mem.free
        },
        network: network.map(net => ({
            interface: net.iface,
            rx_bytes: net.rx_bytes,
            tx_bytes: net.tx_bytes
        }))
    };
};

/**
 * Get disk usage information
 */
exports.getDiskInfo = async () => {
    try {
        const disks = nodeDiskInfo.getDiskInfoSync();
        return disks.map(disk => ({
            filesystem: disk.filesystem,
            mounted: disk.mounted,
            size: disk.blocks,
            used: disk.used,
            available: disk.available,
            usedPercentage: disk.capacity
        }));
    } catch (error) {
        return { error: error.message };
    }
};