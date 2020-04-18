const child_process = require('child_process');
const path = require('path');

// use scanimage to scan
// use convert from imagemagick to convert images to pdf

const IMAGE_URL_PREFIX = '../scans';
const SAVE_URL_PREFIX = '../saves';

const startScanFunc = (source, scanPageId, addToImageList) => {
    return new Promise((resolve, reject) => {
        let args = ['--device-name="' + scanner.deviceName + '"', '--format=tiff', '--resolution=600'];

        if (source === 0) {
            args.push('--source="Automatic Document Feeder"');
            args.push('--batch=' + scanPageId + '-%d.tiff');
        } else {
            args.push('> ' + scanPageId + '.tiff');
        }

        let pageCount = 0;
        scanner.scanProc = child_process.spawn('scanimage', args);
        scanner.scanProc.on('data', (data) => {
            const dataString = data.toString();
            console.log(dataString);
            const scannedPageRegex = /Scanned page (\d+)/g;
            const matches = scannedPageRegex.exec(dataString);
            for (let i = 0; i < matches.length; i++) {
                pageCount++;
                addToImageList(scanPageId + '-' + pageCount + '.tiff');
            }
        });
        scanner.scanProc.on('close', (code) => {
            scanner.scanProc = null;
            if (code !== 0) {
                console.log(code);
                reject('Scanner encountered an error.');
            }
            resolve(pageCount);
        });
    });
};

const saveScansFunc = (scanId, scanList) => {
    return new Promise((resolve, reject) => {
        const args = scanList.map((scanName) => {
            return path.join(__dirname, IMAGE_URL_PREFIX, scanName);
        });
        const saveFile = scanId + '.pdf';
        args.push(path.join(__dirname, SAVE_URL_PREFIX, saveFile));
        const res = child_process.spawnSync('convert', args);
        if (res.status !== 0) {
            reject(res.stderr.toString());
        }
        resolve(saveFile);
    });
};

const saveScanThumbnailFunc = (scanId, scanList) => {
    return new Promise((resolve, reject) => {
        const thumbnail = scanList[0];
        const thumbnailFile = scanId + '.jpg';
        const args = [path.join(__dirname, IMAGE_URL_PREFIX, thumbnail), path.join(__dirname, SAVE_URL_PREFIX, thumbnailFile)];
        const res = child_process.spawnSync('convert', args);
        if (res.status !== 0) {
            reject(res.stderr.toString());
        }
        resolve(thumbnailFile);
    });
};

const cleanupScansFunc = (scanList) => {
    return new Promise((resolve, reject) => {
        const args = scanList.map((scanName) => {
            return path.join(__dirname, IMAGE_URL_PREFIX, scanName);
        });
        const res = child_process.spawnSync('rm', args);
        if (res.status !== 0) {
            console.error(res.stderr.toString());
            resolve();
        }
        resolve();
    });
};

const checkConnectionFunc = () => {
    return new Promise((resolve, reject) => {
        const res = child_process.spawnSync('pwd');
        if (res.status !== 0) {
            resolve(false);
        }
        resolve(true);
    });
};

const getSavesListFunc = () => {
    return new Promise((resolve, reject) => {
        const res = child_process.spawnSync('find', ['.', '-type', 'f', '-name', '*.pdf', '-printf', '%f\n'], {
            cwd: path.join(__dirname, SAVE_URL_PREFIX)
        });
        if (res.status !== 0) {
            reject(res.stderr.toString());
        }
        resolve(res.stdout.toString());
    });
};

const abortFunc = async () => {
    if (scanner.scanProc) {
        return scanner.scanProc.kill();
    }
};

const scanner = {
    scanProc: null,
    deviceName: null,

    init: (deviceName) => {
        scanner.deviceName = deviceName;
    },

    checkConnection: async () => {
        return await checkConnectionFunc();
    },

    startScan: async (source, scanPageId, addToImageList) => {
        return await startScanFunc(source, scanPageId, addToImageList);
    },

    saveScans: async (scanId, scanList) => {
        const scanSave = await saveScansFunc(scanId, scanList);
        const thumbnailSave = await saveScanThumbnailFunc(scanId, scanList);
        await cleanupScansFunc(scanList);
        return [scanSave, thumbnailSave];
    },

    getSavesList: async () => {
        return await getSavesListFunc();
    },

    abort: async () => {
        return await abortFunc();
    }
};

module.exports = scanner;