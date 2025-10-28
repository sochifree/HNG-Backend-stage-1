const express = require('express');
const morgan = require('morgan');

const stringRoute = require('./routes/strings')
const errorHandler = require('./utils/error');


const app = express();

app.use(express.json())
app.use(morgan('dev'))
app.use(express.json({ limit: '1mb' }));

app.use('/strings', stringRoute)

app.get('/health', (req, res)=> res.json({ status: 'ok' }));

app.use(errorHandler);


module.exports = app
