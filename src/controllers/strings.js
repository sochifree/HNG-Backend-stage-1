const StringModel = require('../models/stringModel');
const { analyzeString, sha256 } = require('../services/analyzer');
const { parseNaturalLanguage } = require('../services/nlparser');

function validateCreateBody(body) {
  if (!body || typeof body !== 'object') {
    const err = new Error('Invalid request body');
    err.status = 400;
    throw err;
  }
  if (!('value' in body)) {
    const err = new Error('Missing "value" field');
    err.status = 400;
    throw err;
  }
  if (typeof body.value !== 'string') {
    const err = new Error('"value" must be a string');
    err.status = 422;
    throw err;
  }
  return body.value;
}

async function createString(req, res, next) {
  try {
    const value = validateCreateBody(req.body);
    const props = analyzeString(value); 
    const id = props.sha256_hash;

    const existing = await StringModel.findOne({ $or: [{ id }, { value }] }).lean();
    if (existing) {
      const err = new Error('String already exists');
      err.status = 409;
      throw err;
    }

    const doc = await StringModel.create({
      id,
      value,
      properties: props,
      created_at: new Date().toISOString()
    });

    return res.status(201).json({
      id: doc.id,
      value: doc.value,
      properties: doc.properties,
      created_at: doc.created_at
    });
  } catch (err) {
    next(err);
  }
}

async function getString(req, res, next) {
  try {
    const rawValue = req.params.string_value;
    if (rawValue === undefined) {
      return res.status(400).json({ error: 'missing param' });
    }

    const decoded = decodeURIComponent(rawValue);

    let doc = await StringModel.findOne({ id: decoded }).lean();
    if (!doc) {
      doc = await StringModel.findOne({ value: decoded }).lean();
    }

    if (!doc) {
      const hash = sha256Hash(decoded);
      doc = await StringModel.findOne({ id: hash }).lean();
    }

    if (!doc) {
      return res.status(404).json({ error: 'String not found' });
    }

    return res.status(200).json({
      id: doc.id,
      value: doc.value,
      properties: doc.properties,
      created_at: doc.created_at
    });
  } catch (err) {
    next(err);
  }
}

async function listStrings(req, res, next) {
  try {
    const q = {};

    // parse boolean is_palindrome
    if (req.query.is_palindrome !== undefined) {
      const v = req.query.is_palindrome;
      if (v === 'true' || v === '1') q['properties.is_palindrome'] = true;
      else if (v === 'false' || v === '0') q['properties.is_palindrome'] = false;
      else return res.status(400).json({ error: 'Invalid is_palindrome value' });
    }

    // parse min/max length
    const minLength = req.query.min_length !== undefined ? parseInt(req.query.min_length, 10) : undefined;
    const maxLength = req.query.max_length !== undefined ? parseInt(req.query.max_length, 10) : undefined;
    if (req.query.min_length !== undefined && Number.isNaN(minLength)) {
      return res.status(400).json({ error: 'Invalid min_length' });
    }
    if (req.query.max_length !== undefined && Number.isNaN(maxLength)) {
      return res.status(400).json({ error: 'Invalid max_length' });
    }
    if (minLength !== undefined || maxLength !== undefined) {
      q['properties.length'] = {};
      if (minLength !== undefined) q['properties.length'].$gte = minLength;
      if (maxLength !== undefined) q['properties.length'].$lte = maxLength;
    }

    // parse exact word_count
    if (req.query.word_count !== undefined) {
      const wc = parseInt(req.query.word_count, 10);
      if (Number.isNaN(wc)) return res.status(400).json({ error: 'Invalid word_count' });
      q['properties.word_count'] = wc;
    }

    // contains_character (single character)
    if (req.query.contains_character !== undefined) {
      const ch = req.query.contains_character;
      if (typeof ch !== 'string' || ch.length !== 1) {
        return res.status(400).json({ error: 'contains_character must be a single character' });
      }
      q[`properties.character_frequency_map.${ch}`] = { $exists: true };
    }

    const docs = await StringModel.find(q).sort({ created_at: -1 }).lean();

    const filters_applied = {
      is_palindrome: req.query.is_palindrome === undefined ? undefined : (req.query.is_palindrome === 'true' || req.query.is_palindrome === '1'),
      min_length: minLength,
      max_length: maxLength,
      word_count: req.query.word_count !== undefined ? parseInt(req.query.word_count, 10) : undefined,
      contains_character: req.query.contains_character
    };

    return res.status(200).json({
      data: docs.map(d => ({
        id: d.id,
        value: d.value,
        properties: d.properties,
        created_at: d.created_at
      })),
      count: docs.length,
      filters_applied
    });
  } catch (err) {
    next(err);
  }
}

async function filterByNaturalLanguage(req, res, next) {
  try {
    const raw = req.query.query;
    if (!raw) return res.status(400).json({ error: 'Missing query param' });

    // parseNaturalLanguage should return an object like { original: '...', parsed_filters: { ... } }
    const parsed = parseNaturalLanguage(decodeURIComponent(raw));
    const pf = parsed.parsed_filters || parsed; 

    const q = {};
    if (pf.is_palindrome !== undefined) q['properties.is_palindrome'] = pf.is_palindrome;
    if (pf.word_count !== undefined) q['properties.word_count'] = pf.word_count;
    if (pf.min_length !== undefined || pf.max_length !== undefined) {
      q['properties.length'] = {};
      if (pf.min_length !== undefined) q['properties.length'].$gte = pf.min_length;
      if (pf.max_length !== undefined) q['properties.length'].$lte = pf.max_length;
    }
    if (pf.contains_character !== undefined) {
      q[`properties.character_frequency_map.${pf.contains_character}`] = { $exists: true };
    }

    const docs = await StringModel.find(q).sort({ created_at: -1 }).lean();
    return res.status(200).json({
      data: docs.map(d => ({ id: d.id, value: d.value, properties: d.properties, created_at: d.created_at })),
      count: docs.length,
      interpreted_query: {
        original: parsed.original || raw,
        parsed_filters: pf
      }
    });
  } catch (err) {
    next(err);
  }
}

// DELETE 
async function deleteString(req, res, next) {
  try {
    const rawValue = req.params.string_value;
    if (rawValue === undefined) {
      return res.status(400).json({ error: 'missing param' });
    }
    const decoded = decodeURIComponent(rawValue);

    // try delete by id (sha) then by value
    let deleted = await StringModel.findOneAndDelete({ id: decoded }).lean();
    if (!deleted) {
      deleted = await StringModel.findOneAndDelete({ value: decoded }).lean();
    }
    if (!deleted) {
      const hash = sha256Hash(decoded);
      deleted = await StringModel.findOneAndDelete({ id: hash }).lean();
    }

    if (!deleted) {
      return res.status(404).json({ error: 'String not found' });
    }

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createString,
  getString,
  listStrings,
  filterByNaturalLanguage,
  deleteString
};
