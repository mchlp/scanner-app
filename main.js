const express = require('express');
const next = require('next');
const fs = require('fs');
const api = require('./api/api');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {

    await api.init(config);

    const app = express();

    app.use(express.json());

    app.use('/api', api.router);

    app.get('*', (req, res) => {
        return handle(req, res);
    });

    const server = app.listen(config['api-port'], 'localhost', (err) => {
        if (err) throw err;
        console.log('API listening on localhost:' + config['api-port']);
    });

}).catch((err) => {
    console.error(err.stack);
    process.exit(1);
});