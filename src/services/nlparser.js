// Very small rule-based natural language parser for simple filter phrases.

function parseNaturalLanguage(query) {
const original = query;
const out = {};
const lower = query.toLowerCase();


if (/palindromic|palindrome/.test(lower)) out.is_palindrome = true;
if (/single word|one word/.test(lower)) out.word_count = 1;


const longerMatch = lower.match(/longer than (\d+)/);
if (longerMatch) out.min_length = parseInt(longerMatch[1], 10) + 1;


const betweenMatch = lower.match(/between (\d+) and (\d+)/);
if (betweenMatch) {
out.min_length = parseInt(betweenMatch[1], 10);
out.max_length = parseInt(betweenMatch[2], 10);
}


const containsLetter = lower.match(/letter ([a-z0-9])/);
if (containsLetter) out.contains_character = containsLetter[1];


if (/first vowel/.test(lower)) out.contains_character = 'a'; // heuristic


if (Object.keys(out).length === 0) {
throw new Error('Unable to parse natural language query');
}


return { original, parsed_filters: out };
}


module.exports = { parseNaturalLanguage };