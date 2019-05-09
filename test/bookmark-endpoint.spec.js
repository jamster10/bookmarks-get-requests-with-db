'use strict';
/*global request, expect*/

const knex = require('knex');
const request = require('supertest');
const app = require('../src/app');
const testBookmarks = require('./bookmark-fixtures');
const BookmarkService = require('../src/bookmark-service');

describe.only('Get endpoints resolve correctly', () => {
  let db;
  const table = 'bookmarks';

  before('Create Instance of DB', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    }); 
    app.set('db', db);
  });
  
  before('Clean up the database', () => {
    return db(table).truncate();
  });

  afterEach('Empty table again', () => {
    return db(table).truncate();
  });

  after('Break the connection to DB', () => {
    return db.destroy();
  });

  context('DB has bookmarks', () => {
    beforeEach('Initialize bookmarks', () => {
      console.log('in here now');
      return db
        .insert(testBookmarks)
        .into(table);
    });

    it('GET/bookmarks resolves with all bookmarks', () => {
      return request(app)
        .get('/bookmarks')
        .set('Authorization', 'a abcd')
        .expect(200, testBookmarks);
        
    });

    it('GET/bookmarks/:bookmark_id resolves with a specific bookmark', () => {
      return request(app)
        .get('/bookmarks/2')
        .set('Authorization', 'a abcd')
        .expect(200, testBookmarks[1]);
    });

    it('GET/bookmarks/:bookmark_id resolves with no bookmark if not found', () => {
      return request(app)
        .get('/bookmarks/10')
        .set('Authorization', 'a abcd')
        .expect(404);
    });
  });

});