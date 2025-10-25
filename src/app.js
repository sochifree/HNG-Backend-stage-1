const express = require('express');
const morgan = require('morgan');

const stringRoute = require('./routes/strings')
const { errorHandler, notFoundHandler } = require('./utils/error');


const app = express();

app.use(express.json())
app.use(morgan('dev'))

app.use('/strings', stringRoute)

app.get('/', (req, res)=> res.json({ status: 'ok' }));

// 404
app.use(notFoundHandler);

// central error handler
app.use(errorHandler);

module.exports = app