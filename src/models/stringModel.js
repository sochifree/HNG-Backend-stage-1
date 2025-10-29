const mongoose = require('mongoose')
const stringSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    value: { type: String, required: true },
     properties: {type: Object, required: true },
    created_at: { type: Date, default: ()=> new Date().toISOString()}
});

module.exports = mongoose.model('StringRecord', stringSchema);


