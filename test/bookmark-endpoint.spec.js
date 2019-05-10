'use strict';
/*global request, expect*/

const knex = require('knex');

const app = require('../src/app');
const testBookmarks = require('./bookmark-fixtures');


describe('All CRUD endpoints working', () =>{
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

  describe('GET endpoints resolve correctly', () => {
  
    context('DB has bookmarks', () => {
      beforeEach('Initialize bookmarks', () => {
        return db
          .insert(testBookmarks)
          .into(table);
      });
  
      it('GET/api/bookmarks resolves with all bookmarks', () => {
        return request(app)
          .get('/api/bookmarks')
          .set('Authorization', 'a abcd')
          .expect(200, testBookmarks);
          
      });
  
      it('GET/api/bookmarks/:bookmark_id resolves with a specific bookmark', () => {
        return request(app)
          .get('/api/bookmarks/5')
          .set('Authorization', 'a abcd')
          .expect(200)
          .then( res => {
            console.log(res);
            expect(res.body).to.eql(testBookmarks[0]);
          });
      });
  
      it('GET/api/bookmarks/:bookmark_id resolves with no bookmark if not found', () => {
        return request(app)
          .get('/api/bookmarks/90')
          .set('Authorization', 'a abcd')
          .expect(404);
      });
  
      it('GET/api/bookmarks/:bookmark_id Handles unauthorzied access', () => {
        return request(app)
          .get('/api/bookmarks/10')
          .set('Authorization', 'a lbcd')
          .expect(401);
      });
  
      it('GET/api/bookmarks/ Handles unauthorzied access', () => {
        return request(app)
          .get('/api/bookmarks')
          .set('Authorization', 'a lbcd')
          .expect(401);
      });
  
      it('GET/api/bookmlkarks/ Handles wrong endpoint', () => {
        return request(app)
          .get('/api/booklkarks')
          .set('Authorization', 'a abcd')
          .expect(404);
      });
  
      it('GET/api/bookmlkarks/ Handles wrong endpoint with no authorization', () => {
        return request(app)
          .get('/api/bookmarks')
          .set('Authorization', 'a abkd')
          .expect(401);
      });
    });
  
    context('DB does not have bookmarks', ()=> {
      
      it('GET/api/bookmarks resolves with no bookmarks when empty', () => {
        return request(app)
          .get('/api/bookmarks')
          .set('Authorization', 'a abcd')
          .expect(200, []);
          
      });
      
      it('GET/api/bookmarks resolves with no bookmarks when empty', () => {
        return request(app)
          .get('/api/bookmarks/2')
          .set('Authorization', 'a abcd')
          .expect(404);
          
      });
    });  
  });
  
  describe('PUSH requests resolve correctly', () => {
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

      it('PUSH /api/bookmarks Resolves a POST request with no data sent', () => {
        return request(app)
          .post('/api/bookmarks')
          .set('Authorization', 'a abcd')
          .send({})
          .expect(400);
      });

      it('PUSH /api/bookmarks/1 Resolves a POST to wrong endpoint', () => {
        return request(app)
          .post('/api/bookmarks/1')
          .set('Authorization', 'a abcd')
          .send({})
          .expect(404);
      });

      it('PUSH /api/bookmarks Resolves a POST with no Authorization', () => {
        return request(app)
          .post('/api/bookmarks')
          .set('Authorization', 'a abcld')
          .send(newData)
          .expect(401);
      });

      it('PUSH /api/bookmarks Resolves a POST and returns the location and id of the new', () => {
        return request(app)
          .post('/api/bookmarks')
          .set('Authorization', 'a abcd')
          .send(newData)
          .expect('location', '/api/bookmarks/1')
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
        id: 30,
        title: 'bad bad',
        url: ' <script>alert("xss");</script>',
        rating: 1,
        description: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.'
      };

      beforeEach('insert malicious article', () => {
        return db
          .into(table)
          .insert(maliciousBookmark)
          .returning('id')
          .then(console.log);
      });

      it.skip('removes XSS attack content', () => {
        return request(app)
          .get(`/api/bookmarks/${maliciousBookmark.id}`)
          .set('Authorization', 'a abcd')
          .expect(200)
          .expect(res => {
            expect(res.body.url).to.eql('Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;');
            expect(res.body.description).to.eql(' &lt;script&gt;alert("xss");&lt;/script&gt;');
          });
      });
    });
  });

  describe.only('PATCH /api/articles/:article_id', () => {
    context('Given no articles', () => {
      it('responds with 404', () => {
        const bookmarkid = 123456;
        return request(app)
          .patch(`/api/articles/${bookmarkid}`)
          .set('Authorization', 'a abcd')
          .expect(404, { message: 'Resource not found' });
      });
    });

    context('Given there are articles in the database', () => {
   
      beforeEach('insert articles', () => {
        return db
          .insert(testBookmarks)
          .into(table).returning('*').then(console.log);
      });
   
      it('responds with 204 and updates the article', () => {
        const idToUpdate = 3;
        const updateArticle = {
          title: 'updated',
          description: 'updated article content',
        };
        return request(app)
          .patch('/api/bookmarks/3')
          .set('Authorization', 'a abcd')
          .send(updateArticle)
          .expect(204);
      });
    });

  });

});


