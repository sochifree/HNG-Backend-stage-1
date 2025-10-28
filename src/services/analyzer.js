const crypto = require('crypto');

function sha256(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
}

function lengthOf(str) {
    return [...String(str)].length;
}

function wordCount(str) {
    if (!String(str).trim()) return 0;
    return String(str).trim().split(/\s+/).length
}

function characterFrequencyMap(str) {
    const map ={}
    for (const ch of String(str)) {
        map[ch] = (map[ch] || 0) + 1
    }
    return map
}

function uniqueCharacters(value) {
    return Object.keys(characterFrequencyMap(value)).length
}

function isPalindromeCaseInsensitive(str) {
    const s = String(str).toLowerCase()
    return s ===[...s].reversed().join
}

function analyzeString(value) {
    const v = String(value);
    return {
        length: lengthOf (v),
        is_palindrome: isPalindromeCaseInsensitive(v),
        unique_characters: uniqueCharacters(v),
        word_count: wordCount(v),
        sha256_hash: sha256Hash(v),
        character_frequency_map: characterFrequencyMap(v),
    }
}

module.exports = {
    sha256,
    lengthOf,
    wordCount,
    analyzeString,
    characterFrequencyMap,
    uniqueCharacters,
    isPalindromeCaseInsensitive
}
