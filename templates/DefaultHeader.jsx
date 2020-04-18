import Head from 'next/head';
import React from 'react';
import pageList from './pageList';

const DefaultHeader = (props) => (
    <div>
        <Head>
            <title>{pageList[props.page].title} - Scanner App</title>
            <link rel='icon' href='/favicon.ico' />
            <script src='./jquery-3.4.1.slim.min.js' />
            <script src='https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js' integrity='sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo' crossOrigin='anonymous'></script>
            <script src='./bootstrap.bundle.min.js' />
            <link rel='stylesheet' type='text/css' href='./bootstrap.min.css' />
            <link rel='stylesheet' type='text/css' href='./styles.css' />
        </Head>
    </div>
);

export default DefaultHeader;