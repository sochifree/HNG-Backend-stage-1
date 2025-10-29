function parseNaturalLanguage(raw) {
  if (!raw || typeof raw !== 'string') {
    const err = new Error('query must be a string');
    err.status = 400;
    throw err;
  }
  const q = raw.toLowerCase();

  const filters = {};

  // single word / one word
  if (/\b(single|one)\s+word\b/.test(q) || /\bonly one word\b/.test(q)) {
    filters.word_count = 1;
  }

  // palindromic / palindrome
  if (/\bpalindrom/.test(q)) {
    filters.is_palindrome = true;
  }

  // longer than N characters -> min_length = N+1
  const longerChars = q.match(/longer than (\d+)\s*characters?/);
  if (longerChars) {
    const n = parseInt(longerChars[1], 10);
    if (!Number.isNaN(n)) filters.min_length = n + 1;
  } else {
    // fallback: "longer than N"
    const longer = q.match(/longer than (\d+)/);
    if (longer) {
      const n = parseInt(longer[1], 10);
      if (!Number.isNaN(n)) filters.min_length = n + 1;
    }
  }

  // containing the letter x
  const contains = q.match(/contain(?:s|ing)?(?: the)? letter ([a-z])/);
  if (contains) filters.contains_character = contains[1];

  // "palindromic strings that contain the first vowel" - basic heuristic: 'a'
  if (/\bfirst vowel\b/.test(q) && filters.is_palindrome) {
    filters.contains_character = filters.contains_character || 'a';
  }

  if (Object.keys(filters).length === 0) {
    const err = new Error('Unable to parse natural language query');
    err.status = 400;
    throw err;
  }

  // sanity check
  if (filters.min_length !== undefined && filters.max_length !== undefined && filters.min_length > filters.max_length) {
    const err = new Error('Conflicting filters');
    err.status = 422;
    throw err;
  }

  return { original: raw, parsed_filters: filters };
}

module.exports = { parseNaturalLanguage };
