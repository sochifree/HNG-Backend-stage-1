const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const StringModel = require('../src/models/stringModel');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  await StringModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('String Analyzer API', () => {
  test('POST /strings creates new analyzed string', async () => {
    const res = await request(app)
      .post('/strings')
      .send({ value: 'Racecar' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.value).toBe('Racecar');
    expect(res.body.properties.is_palindrome).toBe(true);
    expect(res.body.properties.word_count).toBe(1);
    expect(typeof res.body.properties.sha256_hash).toBe('string');
    expect(res.body).toHaveProperty('created_at');
  });

  test('POST /strings returns 409 if already exists', async () => {
    await request(app).post('/strings').send({ value: 'hello' });
    const res = await request(app).post('/strings').send({ value: 'hello' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/String already exists/);
  });

  test('GET /strings/:string_value fetches by value and id', async () => {
    const post = await request(app).post('/strings').send({ value: 'abc' });
    const id = post.body.id;

    const byValue = await request(app).get('/strings/abc');
    expect(byValue.status).toBe(200);
    expect(byValue.body.id).toBe(id);

    const byId = await request(app).get(`/strings/${id}`);
    expect(byId.status).toBe(200);
    expect(byId.body.value).toBe('abc');
  });

  test('GET /strings supports filtering', async () => {
    await request(app).post('/strings').send({ value: 'level' }); // palindrome, word_count 1
    await request(app).post('/strings').send({ value: 'a b' }); // length small, word count 2
    await request(app).post('/strings').send({ value: 'notapalindrome' });

    const res = await request(app)
      .get('/strings')
      .query({ is_palindrome: 'true', word_count: '1' });

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].value).toBe('level');
  });

  test('GET /strings/filter-by-natural-language parses queries', async () => {
    await request(app).post('/strings').send({ value: 'level' }); // palindrome single word
    await request(app).post('/strings').send({ value: 'noon' }); // palindrome
    await request(app).post('/strings').send({ value: 'this is long' });

    const res = await request(app)
      .get('/strings/filter-by-natural-language')
      .query({ query: 'all single word palindromic strings' });

    expect(res.status).toBe(200);
    expect(res.body.interpreted_query.parsed_filters.word_count).toBe(1);
    expect(res.body.interpreted_query.parsed_filters.is_palindrome).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });

  test('DELETE /strings/:string_value deletes item', async () => {
    await request(app).post('/strings').send({ value: 'delete-me' });
    const del = await request(app).delete('/strings/delete-me');
    expect(del.status).toBe(204);

    const check = await request(app).get('/strings/delete-me');
    expect(check.status).toBe(404);
  });

  test('Bad requests: missing value or wrong types', async () => {
    const res1 = await request(app).post('/strings').send({});
    expect(res1.status).toBe(400);

    const res2 = await request(app).post('/strings').send({ value: 123 });
    expect(res2.status).toBe(422);
  });
});
