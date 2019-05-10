'use strict';

const express = require('express');
const BOOKMARKS = require('../DB');
// const uuid = require('uuid/v4');
const { checkEntries } = require('./validations');
const { logger } = require('../util/middleware');
const { PORT } = require('../config');
const BookmarkService = require('../bookmark-service');
const xss = require('xss');

const bookmarkRouter = express.Router();

const sanitizeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  rating: bookmark.rating,
  description: xss(bookmark.description),
  url: xss(bookmark.url)
});

bookmarkRouter
  .route('/')
  .get((req, res) => {
    const knexInstance = req.app.get('db');
    BookmarkService.getBookmarks(knexInstance)
      .then(bookmarks => 
        res.status(200).json(bookmarks.map(bookmark => sanitizeBookmark(bookmark))))
      .catch(console.log);
  })
  .post(express.json(), (req, res, next) => {
    const { title, rating, description, url} = req.body;
    const errors = checkEntries(title, url, description, Number(rating));
    if (errors){
      logger.error(errors);
      return res.status(400).json(errors);
    }
    
    const newBookmark = {
      title,
      rating,
      description: (!!description && description.trim() !== '') ? description : '', 
      url: xss(url)
    };

    const knexInstance = req.app.get('db');
    BookmarkService.addBookmark(knexInstance, newBookmark)
      .then( id => {

        newBookmark.id = id[0];

        logger.info(`bookmark with id: ${id[0]} has been added to the database`);
        return res.status(201)
          .location(`localhost:${PORT}/bookmarks/${id[0]}`)
          .json(sanitizeBookmark(newBookmark));
      })
      .catch(err => {
        res.status(500).json({message: 'There was a problem resolving your request. We have notified our developers'});
      });
  });

bookmarkRouter
  .route('/:id')
  .all((req, res, next) => {
    const { id } = req.params;
    const knexInstance = req.app.get('db');
    BookmarkService.getBookmarkById(knexInstance, id)
    .then(bookmark => {
        if(!bookmark){
          return res.status(404).json({message: 'Bookmark not found'});
        }
        res.bookmark = bookmark;
        next();
      })
      .catch(next);
  })
  .get((req, res) => {
    return res.status(200).json(sanitizeBookmark(res.bookmark));
  })
  .delete( (req, res) => {
    const knexInstance = req.app.get('db');
    BookmarkService.deleteBookmark(knexInstance, res.bookmark.id)
      .then(_ => {
        logger.info(`Bookmark with id: ${res.bookmark.id}, has been removed`);
        return res.status(204).end();
      })
      .catch(console.log);
    
  });

module.exports = bookmarkRouter;