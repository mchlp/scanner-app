import React from 'react';
import PageWrapper from '../templates/PageWrapper';
import Axios from 'axios';

export default function Admin() {

    const abortJob = () => {
        Axios.post('/api/abort', {
            force: true
        });
        window.location.reload(false);
    };

    const shutdown = () => {
        Axios.post('/api/shutdown');
        window.location.reload(true);
    };

    const clearSaves = () => {
        Axios.post('/api/clearSaves');
        window.location.reload(false);
    };

    return (
        <PageWrapper page='admin'>
            <div className='container mt-5'>
                <button className='btn btn-danger' onClick={abortJob}>Abort Current Job</button>
                <button className='ml-3 btn btn-danger' onClick={shutdown}>Shutdown</button>
                <button className='ml-3 btn btn-danger' onClick={clearSaves}>Clear Saves</button>
            </div>
        </PageWrapper>
    );
}
