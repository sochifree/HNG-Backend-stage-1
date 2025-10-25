function notFoundHandler(req, res, next) {
res.status(404).json({ error: 'Not Found' });
}


function errorHandler(err, req, res, next) {
// Joi validation errors
if (err && err.isJoi) {
return res.status(422).json({ error: err.details.map(d => d.message).join(', ') });
}


// Custom error with status
if (err && err.status && err.message) {
return res.status(err.status).json({ error: err.message });
}


console.error(err);
res.status(500).json({ error: 'Internal Server Error' });
}


module.exports = { notFoundHandler, errorHandler };