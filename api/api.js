const express = require('express');
const router = express.Router();
const path = require('path');

let globals = {};

const CONSTANTS = {
    SCAN_STATUS: {
        READY: 'ready',
        SCANNING_NOT_AUTH: 'scanning_not_auth',
        SCANNING: 'scanning',
        DONE_SCAN: 'scan_done',
        PACKAGING: 'packaging',
        ERROR: 'error'
    }
};

const init = async (config) => {
    globals.users = config.users.map((user, index) => {
        return {
            id: index,
            ...user
        };
    });

    globals.curScan = {
        status: CONSTANTS.SCAN_STATUS.READY,
        scanId: null,
        scans: []
    };
};

router.get('/', (req, res) => {
    res.send('Scanner App API');
});

router.get('/users', (req, res) => {
    res.json(globals.users);
});

router.get('/sources', (req, res) => {
    res.json([
        {
            id: 0,
            name: 'Feeder'
        },
        {
            id: 1,
            name: 'Glass'
        }
    ]);
});

router.post('/scan', (req, res) => {
    const user = req.body.user;
    const source = req.body.source;
    if (!user || !source) {
        res.sendStatus(400);
        return;
    }

    if (globals.curScan.status === CONSTANTS.SCAN_STATUS.SCANNING) {
        res.json({
            success: false,
            message: 'Scanning in Progress. Must wait until current scan is complete.'
        });
        return;
    }

    if (globals.curScan.status === CONSTANTS.SCAN_STATUS.READY) {
        const scanId = user + '-' + Date.now();
        globals.curScan = {
            status: CONSTANTS.SCAN_STATUS.SCANNING,
            scanId,
            scans: []
        };
    }

    // start scan

    res.json({
        success: true,
        scanId: globals.curScan.scanId,
        message: 'Scanning... Scan Job ID: ' + globals.curScan.scanId
    });

    setTimeout(() => {
        globals.curScan.scans.push('space.jpg');
    }, 2000);

    setTimeout(() => {
        globals.curScan.status = CONSTANTS.SCAN_STATUS.DONE_SCAN;
    }, 4000);
});

router.post('/status', (req, res) => {
    const scanId = req.body.scanId;
    if (!scanId) {
        res.sendStatus(400);
        return;
    }
    if (globals.curScan.status === CONSTANTS.SCAN_STATUS.READY) {
        res.json({
            status: CONSTANTS.SCAN_STATUS.READY
        });
    } else {
        if (globals.curScan.scanId === scanId) {
            res.json({
                status: globals.curScan.status,
                scans: globals.curScan.scans
            }).end();
        } else {
            res.json({
                status: CONSTANTS.SCAN_STATUS.SCANNING_NOT_AUTH
            });
        }
    }
});

router.get('/getscan/:filename', (req, res) => {
    const filename = req.params.filename;
    if (!filename) {
        res.sendStatus(400);
        return;
    }
    const options = {
        maxAge: 0,
        root: path.join(__dirname, '../scans'),
        lastModified: false,
        headers: {},
        dotfiles: 'deny'
    };
    res.sendFile(filename, options);
});

router.post('/deletescan', (req, res) => {
    const filename = req.body.imageURL;
    if (!filename) {
        res.sendStatus(400);
        return;
    }
    globals.curScan.scans = globals.curScan.scans.filter((imageName) => {
        imageName !== filename;
    });
    res.json({
        success: true
    });
});

router.post('/sendemail', (req, res) => {
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
        globals.curScan.status = CONSTANTS.SCAN_STATUS.PACKAGING;
        res.json({
            success: true
        });
        setTimeout(() => {
            globals.curScan.status = CONSTANTS.SCAN_STATUS.READY;
            globals.curScan.scanId = null;
        }, 2000);
    }
});

module.exports = { init, router };