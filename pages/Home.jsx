import React from 'react';
import PageWrapper from '../templates/PageWrapper';
import ConfigSection from '../components/ConfigSection';
import PreviewSection from '../components/PreviewSection';
import ScanListContext from '../components/ScanListContext';

export default function Home() {

    const [scanList, setScanList] = React.useState([]);

    return (
        <ScanListContext.Provider value={{ scanList, setScanList }}>
            <PageWrapper page='home'>
                <div className='container mt-5'>
                    <ConfigSection />
                    <PreviewSection />
                </div>
            </PageWrapper>
        </ScanListContext.Provider>
    );
}