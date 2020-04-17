import React from 'react';
import PageWrapper from '../templates/PageWrapper';
import ConfigSection from '../components/ConfigSection';
import PreviewSection from '../components/PreviewSection';

export default class Home extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            scanList: []
        };
    }

    updateScanList = async (newScanList) => {
        await this.setState({
            scanList: newScanList
        });
    }

    render() {
        return (
            <PageWrapper page='home'>
                <div className='container mt-5'>
                    <ConfigSection updateScanList={this.updateScanList} />
                    <PreviewSection scanList={this.state.scanList} />
                </div>
            </PageWrapper>
        );
    }
}
