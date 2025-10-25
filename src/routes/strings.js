const express = require('express')
const router = express.Router()
//const ctrl = require('../controllers/strings');

const {     createString,
    getString,
    parseNaturalLanguage,
    filterByNaturalLanguage,
    listStrings,
    deleteString} = require('../controllers/strings')

router.post('/', createString);
router.get('/', listStrings);
router.get('/filter-by-natural-language', filterByNaturalLanguage);
router.get('/:string_value', getString)
router.delete('/:string_value', deleteString);

module.exports = router;