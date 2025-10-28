const mongoose = require('mongoose')
const stringSchema = new mongoose.Schema({
    id: { type: String, require: true, unique: true },
    value: { type: String, required: true },
     properties: {type: Object, required: true
    //     length: Number,
    //     is_palindrome: Boolean,
    //     unique_characters: Number,
    //     word_count: Number,
    //     sha_256_hash: String,
    //     character_frequency_map: {type: Map, of: Number }
    },
    created_at: { type: Date, default: ()=> new Date().toISOString()}
});

module.exports = mongoose.model('StringRecord', stringSchema);


//value must exist and be a string. Else
//respond 422 (unprocessable entity) if value exist but not a string          
//or 400 (bad request) if body missing value
