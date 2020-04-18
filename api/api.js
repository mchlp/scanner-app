const express = require('express');
const router = express.Router();
const path = require('path');
const scanner = require('./scanner');

const CONSTANTS = {
    STATUSES: {
        NOT_CONNECTED: 'not-connected',
        READY: 'ready',
        SCANNING_NOT_AUTH: 'scanning_not_auth',
        SCANNING: 'scanning',
        DONE_SCAN: 'scan_done',
        PACKAGING: 'packaging',
        ERROR: 'error'
    },
    IMAGE_URL_PREFIX: '../scans',
    SAVE_URL_PREFIX: '../saves',
    SOURCES_LIST: [
        {
            id: 0,
            name: 'Feeder'
        },
        {
            id: 1,
            name: 'Glass'
        }
    ]
};

let globals = {
    curScan: {
        status: CONSTANTS.STATUSES.NOT_CONNECTED,
        scanId: null,
        scanList: [],
        scanCount: 0
    }
};

const init = (config) => {
    scanner.init(config['device-name']);
};

router.get('/', (req, res, next) => {
    try {
        res.send('Scanner App API');
    } catch (err) {
        next(err);
    }
});

router.get('/sources', (req, res, next) => {
    try {
        res.json(CONSTANTS.SOURCES_LIST);
    } catch (err) {
        next(err);
    }
});

router.post('/scan', async (req, res, next) => {
    try {
        const source = req.body.source;
        if (!source) {
            res.sendStatus(400);
            return;
        }

        if (globals.curScan.status === CONSTANTS.STATUSES.SCANNING || globals.curScan.status === CONSTANTS.STATUSES.ERROR) {
            res.json({
                success: false,
            });
            return;
        }

        if (globals.curScan.status === CONSTANTS.STATUSES.READY) {
            const scanId = 'scan_' + Date.now();
            globals.curScan.scanId = scanId;
            globals.curScan.scanCount = 0;
            globals.curScan.scanList = [];
        }

        globals.curScan.status = CONSTANTS.STATUSES.SCANNING;

        const scanPageId = globals.curScan.scanId + '_' + globals.curScan.scanCount;
        globals.curScan.scanCount++;

        const addToImageList = (scannedImage) => {
            globals.curScan.scanList.push(scannedImage);
        };

        scanner.startScan(source, scanPageId, addToImageList).then((scanCount) => {
            globals.curScan.status = CONSTANTS.STATUSES.DONE_SCAN;
        }).catch((err) => {
            globals.curScan.status = CONSTANTS.STATUSES.ERROR;
            console.error(err);
        });

        res.json({
            success: true,
            scanId: globals.curScan.scanId,
        });
    } catch (err) {
        next(err);
    }
});

router.post('/abort', async (req, res, next) => {
    try {
        const scanId = req.body.scanId;
        const force = req.body.force;
        if (!scanId && !force) {
            res.sendStatus(400);
            return;
        }

        await scanner.abort();

        if ((scanId === globals.curScan.scanId && globals.curScan.status !== CONSTANTS.STATUSES.ERROR) || force) {
            globals.curScan.status = CONSTANTS.STATUSES.READY;
            globals.curScan.scanId = null;
        }
        res.json({
            success: true
        });
    } catch (err) {
        next(err);
    }
});

router.post('/status', async (req, res, next) => {
    try {
        const scanId = req.body.scanId;
        if (globals.curScan.status === CONSTANTS.STATUSES.READY || globals.curScan.status === CONSTANTS.STATUSES.NOT_CONNECTED) {
            const scannerConnected = await scanner.checkConnection();
            if (scannerConnected) {
                globals.curScan.status = CONSTANTS.STATUSES.READY;
                res.json({
                    status: CONSTANTS.STATUSES.READY
                });
            } else {
                globals.curScan.status = CONSTANTS.STATUSES.NOT_CONNECTED;
                res.json({
                    status: CONSTANTS.STATUSES.NOT_CONNECTED
                });
            }
        } else {
            if (globals.curScan.scanId === scanId) {
                res.json({
                    status: globals.curScan.status,
                    scanList: globals.curScan.scanList
                });
            } else {
                res.json({
                    status: CONSTANTS.STATUSES.SCANNING_NOT_AUTH
                });
            }
        }
    } catch (err) {
        next(err);
    }
});

router.get('/getscan/:filename', (req, res, next) => {
    try {
        const filename = req.params.filename;
        if (!filename) {
            res.sendStatus(400);
            return;
        }
        const options = {
            maxAge: 0,
            root: path.join(__dirname, CONSTANTS.IMAGE_URL_PREFIX),
            lastModified: false,
            headers: {},
            dotfiles: 'deny'
        };
        res.sendFile(filename, options);
    } catch (err) {
        next(err);
    }
});

router.post('/deletescan', (req, res, next) => {
    try {
        const filename = req.body.imageURL;
        if (!filename) {
            res.sendStatus(400);
            return;
        }
        globals.curScan.scanList = globals.curScan.scanList.filter((imageName) => {
            imageName !== filename;
        });
        res.json({
            success: true
        });
    } catch (err) {
        next(err);
    }
});

router.post('/save', (req, res, next) => {
    try {
        const scanId = req.body.scanId;
        if (!scanId) {
            res.sendStatus(400);
            return;
        }
        if (!globals.curScan) {
            res.json({
                success: false
            });
        } else {
            if (globals.curScan.scanId === scanId) {
                globals.curScan.status = CONSTANTS.STATUSES.PACKAGING;
                res.json({
                    success: true
                });
                scanner.saveScans(globals.curScan.scanId, globals.curScan.scanList).then(() => {
                    globals.curScan.status = CONSTANTS.STATUSES.READY;
                    globals.curScan.scanId = null;
                }).catch((err) => {
                    globals.curScan.status = CONSTANTS.STATUSES.ERROR;
                    console.error(err);
                });
            } else {
                res.json({
                    success: false
                });
            }
        }
    } catch (err) {
        next(err);
    }
});

router.get('/getsaveslist', async (req, res, next) => {
    try {
        const savesList = await scanner.getSavesList();
        res.json({
            savesList: savesList.split('\n').filter(String)
        });
    } catch (err) {
        next(err);
    }
});

router.get('/getsaves/:filename', (req, res, next) => {
    try {
        const filename = req.params.filename;
        if (!filename) {
            res.sendStatus(400);
            return;
        }
        const options = {
            maxAge: 0,
            root: path.join(__dirname, CONSTANTS.SAVE_URL_PREFIX),
            lastModified: false,
            headers: {},
            dotfiles: 'deny'
        };
        res.sendFile(filename, options);
    } catch (err) {
        next(err);
    }
});

module.exports = { init, router };