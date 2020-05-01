import React from 'react';
import path from 'path';
import Axios from 'axios';
import LoadingButton from './LoadingButton';
import ScanListContext from './ScanListContext';

export default function PreviewSection() {
    const IMAGE_URL_PREFIX = '/api/getscan';
    const [deleteElement, setDeleteElement] = React.useState(null);

    const { scanList, setScanList } = React.useContext(ScanListContext);

    const deletePage = (imageURL) => {
        setDeleteElement(imageURL);
        Axios.post('/api/deletescan', {
            imageURL
        });
    };

    let imageList = [];
    if (scanList) {
        imageList = scanList.map((imageURL, index) => {
            const deleteBtnLoading = deleteElement === imageURL ? 1 : 0;
            const totalPages = scanList.length;
            return (
                <div key={index}>
                    <img width='100%' src={path.join(IMAGE_URL_PREFIX, imageURL)} />
                    <div>Page {index + 1} of {totalPages} <LoadingButton type='button' loading={deleteBtnLoading} onClick={() => { deletePage(imageURL); }} className='btn btn-danger ml-2 my-2'>Delete Above Page</LoadingButton></div>
                </div>
            );
        });
    }

    return (
        <div>
            {imageList}
        </div>
    );
}
