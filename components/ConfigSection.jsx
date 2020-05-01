import React from 'react';
import Axios from 'axios';
import LoadingButton from './LoadingButton';
import ScanListContext from './ScanListContext';

export default function ConfigSection(props) {

    const STATUSES = {
        NOT_CONNECTED: 'not_connected',
        READY: 'ready',
        SCANNING_NOT_AUTH: 'scanning_not_auth',
        SCANNING: 'scanning',
        DONE_SCAN: 'scan_done',
        PACKAGING: 'packaging',
        ERROR: 'error'
    };

    const [status, setStatus] = React.useState(STATUSES.NOT_CONNECTED);
    const [statusText, setStatusText] = React.useState('Not Connected');
    const [statusRed, setStatusRed] = React.useState(true);
    const [sources, setSources] = React.useState([]);
    const [message, setMessage] = React.useState(null);
    const [scanId, setScanId] = React.useState(null);
    const [checkStatusDone, setCheckStatusDone] = React.useState(true);
    const { scanList, setScanList } = React.useContext(ScanListContext);
    const [scanNextButtonLoading, setScanNextButtonLoading] = React.useState(false);

    const checkStatusCallback = React.useRef();
    const checkStatusInterval = React.useRef();

    React.useEffect(() => {
        const initState = async () => {
            const sourcesRes = await Axios.get('/api/sources');
            setSources(sourcesRes.data);
        };
        setScanId(localStorage.getItem('scanId'));
        initState();
        return async function cleanup() {
            clearInterval(checkStatusInterval.current);
            await Axios.get('/api/abort', {
                scanId
            });
        };
    }, []);

    React.useEffect(() => {
        checkStatusCallback.current = checkStatus;
    });

    React.useEffect(() => {
        const func = async () => {
            await checkStatus();
        };
        localStorage.setItem('scanId', scanId);
        console.log(scanId);
        func();
    }, [scanId]);

    const handleScan = async (e) => {
        setScanNextButtonLoading(true);
        const res = await Axios.post('/api/scan', {
            source: document.getElementById('source-select').value
        });
        if (res.data.success) {
            setScanId(res.data.scanId);
            const tick = () => {
                checkStatusCallback.current();
            };
            clearInterval(checkStatusInterval.current);
            setCheckStatusDone(true);
            checkStatusInterval.current = setInterval(tick, 1000);
        } else {
            setStatus(STATUSES.SCANNING_NOT_AUTH);
            setMessage('Someone else is currently scanning. Please try again later.');
        }
    };

    const saveScan = async (e) => {
        await Axios.post('/api/save', {
            scanId
        });
    };

    const checkStatus = async (e) => {
        if (checkStatusDone) {
            let res;
            res = await Axios.post('/api/status', {
                scanId
            });
            setCheckStatusDone(true);
            setStatus(res.data.status);
            setScanNextButtonLoading(false);
            switch (res.data.status) {
                case STATUSES.NOT_CONNECTED:
                    setMessage('Scanner is not connected. Please check the connection and reload. Select SCANS > Remote Scanner to enter scan mode.');
                    setStatusText('Not Connected');
                    setStatusRed(true);
                    break;
                case STATUSES.READY:
                    if (status === STATUSES.PACKAGING) {
                        setMessage('Scan successfully saved. Go to old scans page to download. Reload to start another scan.');
                    } else {
                        setMessage('Scanner is ready.  Select SCANS > Remote Scanner to enter scan mode.');
                    }
                    if (checkStatusInterval.current) {
                        clearInterval(checkStatusInterval.current);
                        checkStatusInterval.current = null;
                    }
                    setStatusText('Ready');
                    setStatusRed(false);
                    setScanList([]);
                    break;
                case STATUSES.SCANNING_NOT_AUTH:
                    setMessage('Someone else is currently scanning. Please reload and try again later.');
                    setStatusText('In Use');
                    setStatusRed(true);
                    break;
                case STATUSES.SCANNING:
                    setStatusText('Scanning');
                    setStatusRed(false);
                    setMessage('Scanning... Scan Job ID: ' + scanId);
                    setScanList(res.data.scanList);
                    break;
                case STATUSES.DONE_SCAN:
                    setStatusText('Scan Complete');
                    setStatusRed(false);
                    setMessage('Scan Complete. Please preview the pages and click "Save Scans" when ready or scan more pages.');
                    setScanList(res.data.scanList);
                    break;
                case STATUSES.PACKAGING:
                    setStatusText('Packaging Scan');
                    setStatusRed(false);
                    setMessage('Packaging scan... Please wait.');
                    break;
                case STATUSES.ERROR:
                    setStatusText('Error Encountered');
                    setStatusRed(true);
                    setMessage('An error occured. Please reload and try again.');
                    break;
            }
        }
    };

    const clearError = async (e) => {
        await Axios.post('/api/abort', {
            force: true
        });
        await checkStatus();
    };

    const abortScan = async (e) => {
        await Axios.post('/api/abort', {
            scanId
        });
        await checkStatus();
    };

    let sourcesSelectList;
    let sourcesLoaded = sources.length > 0;
    if (sourcesLoaded) {
        sourcesSelectList = sources.map((sources) => {
            return (
                <option key={sources.id} value={sources.id}>{sources.name}</option>
            );
        });
    } else {
        sourcesSelectList = (
            <option>Sources Loading...</option>
        );
    }

    const scanBtnHidden = !(status === STATUSES.READY || status === STATUSES.DONE_SCAN);
    const scanBtnLoading = status === scanNextButtonLoading ? 1 : 0;
    const sendEmailBtnHidden = !(status === STATUSES.DONE_SCAN);
    const sendEmailBtnLoading = status === STATUSES.PACKAGING ? 1 : 0;
    const clearErrorBtnHidden = !(status === STATUSES.ERROR);
    const abortScanBtnHidden = !(status === STATUSES.SCANNING);

    return (
        <div>
            <div className={'card text-white bg-primary mb-2 ' + (statusRed ? 'bg-danger' : 'bg-success')}>
                <div className='card-body'>
                    <h5 className='card-text text-center'>
                        <b>Status:</b> {statusText}
                    </h5>
                </div>
            </div>
            <div className='form-group'>
                <label htmlFor='source-select'>Select Source:</label>
                <select disabled={!sourcesLoaded} className='form-control' id='source-select'>
                    {sourcesSelectList}
                </select>
            </div>
            <div>
                <LoadingButton type='button' hidden={scanBtnHidden} loading={scanBtnLoading} disabled={scanBtnLoading} onClick={handleScan} className='btn btn-primary'>Scan Next Page</LoadingButton>
                <LoadingButton type='button' hidden={sendEmailBtnHidden} loading={sendEmailBtnLoading} onClick={saveScan} className='btn btn-success ml-2'>Save Scan</LoadingButton>
                <LoadingButton type='button' hidden={abortScanBtnHidden} onClick={abortScan} className='btn btn-danger ml-2'>Abort Scan</LoadingButton>
                <LoadingButton type='button' hidden={clearErrorBtnHidden} onClick={clearError} className='btn btn-danger ml-2'>Clear Error</LoadingButton>
            </div>
            <div hidden={!message} className='alert alert-secondary mt-3' role='alert'>
                {message}
            </div>
        </div >
    );
}
