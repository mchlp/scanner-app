import React, { Component } from 'react';
import path from 'path';
import Axios from 'axios';
import LoadingButton from './LoadingButton';

export default class PreviewSection extends Component {

    constructor(props) {
        super(props);
        this.state = {
            deleting: null
        };
    }

    CONSTANTS = {
        IMAGE_URL_PREFIX: '/api/getscan'
    }

    deletePage = (imageURL) => {
        this.setState({
            deleting: imageURL
        });
        Axios.post('/api/deletescan', {
            imageURL
        });
    }

    render() {
        const imageList = this.props.scanList.map((imageURL, index) => {
            const deleteBtnLoading = this.state.deleting === imageURL ? 1 : 0;
            const totalPages = this.props.scanList.length;
            return (
                <div key={index}>
                    <img width='100%' src={path.join(this.CONSTANTS.IMAGE_URL_PREFIX, imageURL)} />
                    <div>Page {index + 1} of {totalPages} <LoadingButton type='button' loading={deleteBtnLoading} onClick={() => { this.deletePage(imageURL); }} className='btn btn-danger ml-2 my-2'>Delete Above Page</LoadingButton></div>
                </div>
            );
        });
        return (
            <div>
                {imageList}
            </div>
        );
    }
}
