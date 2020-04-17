import React, { Component } from 'react';
import Axios from 'axios';
import LoadingButton from './LoadingButton';

export default class ConfigSection extends Component {
    constructor(props) {
        super(props);
        this.state = {
            status: this.CONSTANTS.SCAN_STATUS.READY,
            users: [],
            sources: [],
            message: null,
            curScanId: null,
        };
    }

    async componentDidMount() {
        const usersRes = await Axios.get('/api/users');
        const sourcesRes = await Axios.get('/api/sources');
        this.setState({
            users: usersRes.data,
            sources: sourcesRes.data
        });
    }

    CONSTANTS = {
        SCAN_STATUS: {
            READY: 'ready',
            SCANNING_NOT_AUTH: 'scanning_not_auth',
            SCANNING: 'scanning',
            DONE_SCAN: 'scan_done',
            PACKAGING: 'packaging',
            ERROR: 'error'
        }
    }

    handleScan = async (e) => {
        const res = await Axios.post('/api/scan', {
            user: document.getElementById('user-select').value,
            source: document.getElementById('source-select').value,
        });
        if (res.data.success) {
            await this.setState({
                status: this.CONSTANTS.SCAN_STATUS.SCANNING,
                message: res.data.message,
                scanId: res.data.scanId
            });
            this.checkScanInterval = setInterval(this.checkScan, 2000);
        } else {
            await this.setState({
                status: this.CONSTANTS.SCAN_STATUS.SCANNING_NOT_AUTH,
                message: 'Someone else is currently scanning. Please try again later.'
            });
        }
    }

    checkScan = async (e) => {
        let res;
        res = await Axios.post('/api/status', {
            scanId: this.state.scanId
        });

        if (res.data.status === this.CONSTANTS.SCAN_STATUS.DONE_SCAN || res.data.status === this.CONSTANTS.SCAN_STATUS.SCANNING) {
            this.props.updateScanList(res.data.scans);
        }
        if (res.data.status === this.CONSTANTS.SCAN_STATUS.DONE_SCAN) {
            await this.setState({
                status: this.CONSTANTS.SCAN_STATUS.DONE_SCAN,
                message: 'Scan Complete. Please preview the pages and click "Send Email" when ready or scan more pages.',
            });
            this.props.updateScanList(res.data.scans);
        } else if (res.data.status === this.CONSTANTS.SCAN_STATUS.PACKAGING) {
            await this.setState({
                status: this.CONSTANTS.SCAN_STATUS.PACKAGING,
                message: 'Packaging and emailing scan... Please wait.',
            });
        } else if (res.data.status === this.CONSTANTS.SCAN_STATUS.READY && this.state.status === this.CONSTANTS.SCAN_STATUS.PACKAGING) {
            clearInterval(this.checkScanInterval);
            await this.setState({
                status: this.CONSTANTS.SCAN_STATUS.READY,
                scanId: null,
                message: 'Email Sent Successfully! Reload to start another scan.',
            });
        } else if (res.data.status === this.CONSTANTS.SCAN_STATUS.ERROR) {
            clearInterval(this.checkScanInterval);
            await this.setState({
                status: this.CONSTANTS.SCAN_STATUS.ERROR,
                scanId: null,
                message: 'An error occured. Please reload and try again.',
            });
        }
    }

    sendEmail = async (e) => {
        await Axios.post('/api/sendemail', {
            scanId: this.state.scanId
        });
        await this.checkScan();
    }

    render() {
        let usersSelectList;
        let usersLoaded = this.state.users.length > 0;
        if (usersLoaded) {
            usersSelectList = this.state.users.map((user) => {
                return (
                    <option key={user.id} value={user.id}>{user.name} - {user.email}</option>
                );
            });
        } else {
            usersSelectList = (
                <option>Users Loading...</option>
            );
        }

        let sourcesSelectList;
        let sourcesLoaded = this.state.sources.length > 0;
        if (sourcesLoaded) {
            sourcesSelectList = this.state.sources.map((sources) => {
                return (
                    <option key={sources.id} value={sources.id}>{sources.name}</option>
                );
            });
        } else {
            sourcesSelectList = (
                <option>Sources Loading...</option>
            );
        }

        const scanBtnDisabled = this.state.status === this.CONSTANTS.SCAN_STATUS.SCANNING;
        const scanBtnLoading = this.state.status === this.CONSTANTS.SCAN_STATUS.SCANNING ? 1 : 0;
        const sendEmailBtnDisabled = this.state.status !== this.CONSTANTS.SCAN_STATUS.DONE_SCAN;
        const sendEmailBtnLoading = this.state.status === this.CONSTANTS.SCAN_STATUS.PACKAGING ? 1 : 0;

        return (
            <div>
                <div className='form-group'>
                    <label htmlFor='user-select'>Select User:</label>
                    <select disabled={!usersLoaded} className='form-control' id='user-select'>
                        {usersSelectList}
                    </select>
                </div>
                <div className='form-group'>
                    <label htmlFor='source-select'>Select Source:</label>
                    <select disabled={!usersLoaded} className='form-control' id='source-select'>
                        {sourcesSelectList}
                    </select>
                </div>
                <div>
                    <LoadingButton type='button' disabled={scanBtnDisabled} loading={scanBtnLoading} onClick={this.handleScan} className='btn btn-primary'>Scan Next Page</LoadingButton>
                    <LoadingButton type='button' disabled={sendEmailBtnDisabled} loading={sendEmailBtnLoading} onClick={this.sendEmail} className='btn btn-success ml-2'>Send Email</LoadingButton>
                </div>
                <div hidden={!this.state.message} className='alert alert-secondary mt-3' role='alert'>
                    {this.state.message}
                </div>
            </div >
        );
    }
}
