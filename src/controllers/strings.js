const StringModel = require('../models/stringModel')
const Joi = require('joi');
const { analyzeString, sha256 } = require('../services/analyzer')
const { parseNaturalLanguage } = require('../services/nlparser');

const createSchema = Joi.object({ value: Joi.string().max(10000).required() });
const listQuerySchema = Joi.object({
is_palindrome: Joi.string().valid('true', 'false'),
min_length: Joi.number().integer().min(0),
max_length: Joi.number().integer().min(0),
word_count: Joi.number().integer().min(0),
contains_character: Joi.string().min(1).max(1)
});

async function createString(req, res) {
    const {value} = req.body;
    if(value === undefined) {
        return res.status(400).json({ error: 'Missing "value" field'})
    }
    if (typeof value !== 'string') {
        return res.status(422).json({error: '"value" must be a string'})
    }

    const hash = sha256(value);
    const exist = await StringModel.findOne({ sha256_hash: hash }).lean();
    if(exist) {
        return res.status(409).json({ error: 'String already exists'})
    }

    const props = analyzeString(value);
    const doc = new StringModel({
        sha256_hash: hash,
        value,
        properties: props,
        created_at: new Date().toISOString()
    })

    await doc.save();

    return res.status(201).json({
        id: hash,
        value,
        properties: props,
        created_at: doc.created_at
    })

 }

 async function getString(req, res, next){
    try {
      const rawValue = req.params.string_value;
    if (rawValue === undefined){
         return res.status(400).json({ error: 'missing param' });
    }

    const decoded = decodeURIComponent(rawValue)
    const hash = sha256(rawValue)

    const doc = await StringModel.findOne({ sha256_hash: hash }).lean();
    if(!doc) {
        return res.status(404).json({ error: 'String not found' });
    }

    return res.status(200).json({
        id: doc.sha256_hash,
        value: doc.value,
        properties: doc.properties,
        created_at: doc.created_at
    })
    } catch (error) {
      next(error)
    }
 }

// //natural language parser
// function parseNaturalLanguage(query) {
//   const original = query;
//   const q = {};
  
//   const lower = (query || '').toLowerCase();

//   // if the text mentions "palindrome" or "palindromic"
//   if (/palindromic|palindrome/.test(lower)) q.is_palindrome = true;

//   // if the text mentions single word or one word
//   if (/single word|one word/.test(lower)) q.word_count = 1;

//   // match "longer than 10" -> min_length = 11
//   const longerMatch = lower.match(/longer than (\d+)/);
//   if (longerMatch) q.min_length = parseInt(longerMatch[1], 10) + 1;

//   // match "between 5 and 10" -> min_length and max_length
//   const betweenMatch = lower.match(/between (\d+) and (\d+)/);
//   if (betweenMatch) {
//     q.min_length = parseInt(betweenMatch[1], 10);
//     q.max_length = parseInt(betweenMatch[2], 10);
//   }

//   // match "letter z" or "letter a"
//   const containsLetter = lower.match(/letter ([a-z0-9])/);
//   if (containsLetter) q.contains_character = containsLetter[1];

//   // heuristic: "first vowel" -> 'a' (only if not already set)
//   if (/first vowel/.test(lower) && !q.contains_character) q.contains_character = 'a';

//   // if we parsed nothing, throw an error (caller will handle it)
//   if (Object.keys(q).length === 0) throw new Error('Unable to parse natural language query');

//   return { original, parsed_filters: q };
// }

//  filter controller 
async function filterByNaturalLanguage(req, res, next) {
  try {
    
    const raw = req.query.query;
    if (!raw) return res.status(400).json({ error: 'Missing query param' });

    // decode URL encoding and parse
    const parsed = parseNaturalLanguage(decodeURIComponent(raw));

    // build Mongo query from parsed filters
    const pf = parsed.parsed_filters;
    const q = {};
    if (pf.is_palindrome !== undefined) q['properties.is_palindrome'] = pf.is_palindrome;
    if (pf.word_count !== undefined) q['properties.word_count'] = pf.word_count;
    if (pf.min_length !== undefined || pf.max_length !== undefined) {
      q['properties.length'] = {};
      if (pf.min_length !== undefined) q['properties.length'].$gte = pf.min_length;
      if (pf.max_length !== undefined) q['properties.length'].$lte = pf.max_length;
    }
    if (pf.contains_character !== undefined) {
      const ch = pf.contains_character;
      q[`properties.character_frequency_map.${ch}`] = { $exists: true, $gt: 0 };
    }

    const docs = await StringModel.find(q).lean();
    return res.status(200).json({
      original_query: parsed.original,
      interpreted_query: pf,
      data: docs.map(d => ({ id: d.sha256_hash, value: d.value, properties: d.properties })),
    });
  } catch (err) {
    next(err);
  }
}

//list with query filters
async function listStrings(req, res, next) {
  try {
    const q = {};

    if (req.query.is_palindrome !== undefined) {
      q['properties.is_palindrome'] = req.query.is_palindrome === 'true';
    }

    if (req.query.min_length !== undefined || req.query.max_length !== undefined) {
      q['properties.length'] = {};
      if (req.query.min_length !== undefined) {
        q['properties.length'].$gte = parseInt(req.query.min_length, 10);
      }
      if (req.query.max_length !== undefined) {
        q['properties.length'].$lte = parseInt(req.query.max_length, 10);
      }
    }

    if (req.query.word_count !== undefined) {
      q['properties.word_count'] = parseInt(req.query.word_count, 10);
    }

    if (req.query.contains_character !== undefined) {
      const ch = req.query.contains_character;
      if (ch.length !== 1) {
        return res.status(400).json({ error: 'contains_character must be a single character' });
      }
      q[`properties.character_frequency_map.${ch}`] = { $exists: true, $gt: 0 };
    }


    const docs = await StringModel.find(q).lean();
    return res.status(200).json({ data: docs.map(d => ({ 
        id: d.sha256_hash, value: d.value, properties: d.properties, created_at: d.created_at
    })), 
        count: docs.length, filters_applied: value
    });
    } catch (err) {
      next(err);
    }
}

//delete string
async function deleteString(req, res) {
  try {
    const rawValue = req.params.string_value;
    if (rawValue === undefined) {
      return res.status(400).json({ error: 'missing param' });
    }

    const decoded = decodeURIComponent(rawValue);
    const hash = sha256(decoded);

    const deleted = await StringModel.findOneAndDelete({ sha256_hash: hash }).lean();
    if (!deleted) {
      return res.status(404).json({ error: 'String not found' });
    }

    // Success: no content to return, just status 204
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


module.exports = {
    createString,
    getString,
    parseNaturalLanguage,
    filterByNaturalLanguage,
    listStrings,
    deleteString
}
