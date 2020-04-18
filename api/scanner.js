const child_process = require('child_process');
const path = require('path');
const fs = require('fs');

// use scanimage to scan
// use convert from imagemagick to convert images to pdf

const IMAGE_URL_PREFIX = '../scans';
const SAVE_URL_PREFIX = '../saves';

const startScanFunc = (source, scanPageId, addToImageList) => {
    return new Promise((resolve, reject) => {
        const sourceInt = parseInt(source);
        let args = ['--device-name="' + scanner.deviceName + '"', '--format=tiff'];

        if (sourceInt === 0) {
            args.push('--source="Automatic Document Feeder"');
            args.push('--batch="' + scanPageId + '_%d.tiff"');
        }

        args.push('--resolution=600');

        let outFile;
        if (sourceInt === 1) {
            outFile = fs.createWriteStream(path.join(__dirname, IMAGE_URL_PREFIX, scanPageId + '.tiff'));
        }

        const scanOptions = {
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: path.join(__dirname, IMAGE_URL_PREFIX)
        };

        let pageCount = -1; // first page is nothing
        scanner.scanProc = child_process.spawn('scanimage', args, scanOptions);
        // scanner.scanProc = child_process.spawn('pwd');

        scanner.scanProc.stdout.on('data', (data) => {
            outFile.write(data);
        });

        scanner.scanProc.stderr.on('data', (data) => {
            const dataString = data.toString();
            console.log(dataString);
            const scannedPageRegex = /Scanned page (\d+)/gm;
            const scannerBusyRegex = /Device busy/gm;
            const scannedPageMatches = scannedPageRegex.exec(dataString);
            const scannerBusyMatches = scannerBusyRegex.exec(dataString);
            if (scannerBusyMatches !== null) {
                reject('Scanner is busy');
            }
            if (scannedPageMatches !== null) {
                for (let i = 0; i < scannedPageMatches.length; i++) {
                    pageCount++;
                    if (pageCount >= 1 && sourceInt === 0) {
                        const args = [path.join(__dirname, IMAGE_URL_PREFIX, scanPageId + '_' + pageCount + '.tiff'), path.join(__dirname, IMAGE_URL_PREFIX, scanPageId + '_' + pageCount + '.jpg')];
                        const res = child_process.spawnSync('convert', args);
                        let success = true;
                        if (res.status !== 0) {
                            success = false;
                        }
                        if (success) {
                            child_process.spawnSync('rm', [path.join(__dirname, IMAGE_URL_PREFIX, scanPageId + '_' + pageCount + '.tiff')]);
                            addToImageList(scanPageId + '_' + pageCount + '.jpg');
                        }
                    }
                }
            }
        });

        scanner.scanProc.on('close', (code) => {
            console.log(code);
            if (sourceInt === 1) {
                const args = [path.join(__dirname, IMAGE_URL_PREFIX, scanPageId + '.tiff'), path.join(__dirname, IMAGE_URL_PREFIX, scanPageId + '.jpg')];
                const res = child_process.spawnSync('convert', args);
                let success = true;
                if (res.status !== 0) {
                    success = false;
                }
                if (success) {
                    child_process.spawnSync('rm', [path.join(__dirname, IMAGE_URL_PREFIX, scanPageId + '.tiff')]);
                    addToImageList(scanPageId + '.jpg');
                }
            }
            scanner.scanProc = null;
            if (code !== 0) {
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