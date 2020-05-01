import React from 'react';
import PageWrapper from '../templates/PageWrapper';
import Axios from 'axios';
import path from 'path';


export default function Saved() {

    const SAVE_URL_PREFIX = '/api/getsaves';
    const [savesList, setSavesList] = React.useState([]);

    React.useEffect(() => {
        const func = async () => {
            const res = await Axios.get('/api/getsaveslist');
            setSavesList(res.data.savesList);
        };
        func();
    }, []);

    const parsedSavesList = [...savesList];
    parsedSavesList.sort().reverse();

    const imageList = parsedSavesList.map((saveFile, index) => {
        console.log(saveFile);
        const scanId = saveFile.split('.')[0];
        const thumbnail = scanId + '.jpg';
        const dateTimestamp = parseInt(scanId.split('_')[1]);
        const scanDate = new Date(dateTimestamp);
        const scanDateString = scanDate.toLocaleString('en-CA');
        return (
            <div key={index} style={{
                maxWidth: '300px',
                minWidth: '200px'
            }}>
                <a href={path.join(SAVE_URL_PREFIX, saveFile)} download={saveFile}>
                    <div className='card mt-2'>
                        <div className='card-body'>
                            <img width='100%' src={path.join(SAVE_URL_PREFIX, thumbnail)}></img>
                            <div className='mt-2'><b>Scan Date: </b>{scanDateString}</div>
                        </div>
                    </div>
                </a>
            </div>
        );
    });

    return (
        <PageWrapper page='saved'>
            <div className='container mt-5'>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-around',
                    alignItems: 'flex-start',
                    alignContent: 'flex-start'
                }}>
                    {imageList}
                </div>
            </div>
        </PageWrapper>
    );
}
