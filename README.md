# String Analyzer API  
 
It’s a RESTful API service that analyzes strings, computes their properties, and stores them in a database.  


## Project Overview  
The goal is to build an API that can:  
- Accept a string and analyze it for various properties.  
- Store and retrieve analyzed strings.  
- Support filtering, searching, and deletion of strings.  


## Features  
- Analyze strings for:  
  - **Length**  
  - **Palindrome check**  
  - **Unique character count**  
  - **Word count**  
  - **SHA-256 hash (unique ID)**  
  - **Character frequency map**  
- Fetch all stored strings with filters.  
- Retrieve specific strings by value.  
- Natural language search (e.g., “all single word palindromic strings”).  
- Delete analyzed strings.  


## Tech Stack  
- **Node.js**  
- **Express.js**  
- **MongoDB & Mongoose**  
- **Crypto** (for SHA-256 hashing)  
- **Jest & Supertest** (for testing)  
- **Dotenv, Nodemon** (for config & dev)  


## Live API  
Base URL:  
 [https://hng-backend-stage-1-production-531d.up.railway.app](hng-backend-stage-1-production-531d.up.railway.app)


## Example Request  
**POST** `/strings`  

**Request Body:**  
```json
{
  "value": "madam"
}

Response body
{
  "id": "b1f94f...",
  "value": "madam",
  "properties": {
    "length": 5,
    "is_palindrome": true,
    "unique_characters": 3,
    "word_count": 1,
    "sha256_hash": "b1f94f...",
    "character_frequency_map": {
      "m": 2,
      "a": 2,
      "d": 1
    }
  },
  "created_at": "2025-10-24T12:00:00Z"
}

