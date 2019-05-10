'use strict';
/*global request, expect*/

const knex = require('knex');

const app = require('../src/app');
const testBookmarks = require('./bookmark-fixtures');


describe.only('All CRUD endpoints working', () =>{
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

  describe.skip('GET endpoints resolve correctly', () => {
  
    context('DB has bookmarks', () => {
      beforeEach('Initialize bookmarks', () => {
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
  
      it('GET/bookmarks/:bookmark_id Handles unauthorzied access', () => {
        return request(app)
          .get('/bookmarks/10')
          .set('Authorization', 'a lbcd')
          .expect(401);
      });
  
      it('GET/bookmarks/ Handles unauthorzied access', () => {
        return request(app)
          .get('/bookmarks')
          .set('Authorization', 'a lbcd')
          .expect(401);
      });
  
      it('GET/bookmlkarks/ Handles wrong endpoint', () => {
        return request(app)
          .get('/booklkarks')
          .set('Authorization', 'a abcd')
          .expect(404);
      });
  
      it('GET/bookmlkarks/ Handles wrong endpoint with no authorization', () => {
        return request(app)
          .get('/bookmarks')
          .set('Authorization', 'a abkd')
          .expect(401);
      });
    });
  
    context('DB does not have bookmarks', ()=> {
      
      it('GET/bookmarks resolves with no bookmarks when empty', () => {
        return request(app)
          .get('/bookmarks')
          .set('Authorization', 'a abcd')
          .expect(200, []);
          
      });
      
      it('GET/bookmarks resolves with no bookmarks when empty', () => {
        return request(app)
          .get('/bookmarks/2')
          .set('Authorization', 'a abcd')
          .expect(404);
          
      });
    });  
  });
  
  describe.skip('PUSH requests resolve correctly', () => {
    const newData = {
      id:1,
      title: 'Thinkful',
      url: 'https://www.Thinkful.com',
      description: 'Learn shit',
      rating: 5
    };

    context('DB has bookmarks in it', () => {

      beforeEach('Add bookmarks to DB', () => {
        return db.insert(testBookmarks).into(table);
      });

      it('PUSH /bookmarks Resolves a POST request with no data sent', () => {
        return request(app)
          .post('/bookmarks')
          .set('Authorization', 'a abcd')
          .send({})
          .expect(400);
      });

      it('PUSH /bookmarks/1 Resolves a POST to wrong endpoint', () => {
        return request(app)
          .post('/bookmarks/1')
          .set('Authorization', 'a abcd')
          .send({})
          .expect(404);
      });

      it('PUSH /bookmarks Resolves a POST with no Authorization', () => {
        return request(app)
          .post('/bookmarks')
          .set('Authorization', 'a abcld')
          .send(newData)
          .expect(401);
      });

      it('PUSH /bookmarks Resolves a POST and returns the location and id of the new', () => {
        return request(app)
          .post('/bookmarks')
          .set('Authorization', 'a abcd')
          .send(newData)
          .expect('location', 'localhost:8080/bookmarks/1')
          .expect(201)
          .then(res => {
            expect(res.body).to.eql(newData);
          });
      });
    });
  });

  describe('Site can handle XSS', () => {
  
    context('Given an XSS attack article', () => {
      const maliciousBookmark = {
        id: 1,
        title: 'bad bad',
        url: ' <script>alert("xss");</script>',
        rating: 1,
        description: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.'
      };

      beforeEach('insert malicious article', () => {
        return db
          .into(table)
          .insert(maliciousBookmark);
      });

      it('removes XSS attack content', () => {
        return request(app)
          .get(`/bookmarks/${maliciousBookmark.id}`)
          .set('Authorization', 'a abcd')
          .expect(200)
          .expect(res => {
            expect(res.body.url).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;');
            expect(res.body.description).to.eql('Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.');
          });
      });
    });
  });

});


