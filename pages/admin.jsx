import React from 'react';
import PageWrapper from '../templates/PageWrapper';
import Axios from 'axios';

export default function Admin() {

    const abortJob = () => {
        Axios.post('/api/abort', {
            force: true
        });
    };

    const shutdown = () => {
        Axios.post('/api/shutdown');
    };

    return (
        <PageWrapper page='admin'>
            <div className='container mt-5'>
                <button className='btn btn-danger' onClick={abortJob}>Abort Current Job</button>
                <button className='ml-3 btn btn-danger' onClick={shutdown}>Shutdown</button>

            </div>
        </PageWrapper>
    );
}
