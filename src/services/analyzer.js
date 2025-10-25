const crypto = require('crypto');

function sha256(value) {
    return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function lengthOf(value) {
    return value.length;
}

function wordCount(value) {
    if (!value || value.trim() === "") return 0;
    return value.trim().split(/\s+/).length
}

function characterFrequencyMap(value) {
    const map ={}
    for (const ch of value ) {
        map[ch] = (map[ch] || 0) + 1
    }
    return map
}

function uniqueCharacters(value) {
    return Object.keys(characterFrequencyMap(value)).length
}

function isPalindrome(value) {
    const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const reversed = normalized.split('').reverse().join('');
    return normalized === reversed && normalized.length > 0
}

function analyzeString(value) {
    const sha = sha256(value);
    const freq = characterFrequencyMap(value)
    return {
        length: lengthOf (value),
        is_palindrome: isPalindrome(value),
        unique_characters: Object.keys(freq).length,
        word_count: wordCount(value),
        sha256_hash: sha,
        character_frequency_map: freq,
    }
}

module.exports = {
    sha256,
    lengthOf,
    wordCount,
    analyzeString,
    characterFrequencyMap,
    uniqueCharacters,
    isPalindrome
}