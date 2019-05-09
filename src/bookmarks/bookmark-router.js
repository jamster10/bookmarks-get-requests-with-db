'use strict';

const express = require('express');
const BOOKMARKS = require('../DB');
const uuid = require('uuid/v4');
const { checkEntries } = require('./validations');
const { logger } = require('../util/middleware');
const { PORT } = require('../config');
const BookmarkService = require('../bookmark-service');

const bookmarkRouter = express.Router();

bookmarkRouter
  .route('/')
  .get((req, res) => {
    const knexInstance = req.app.get('db');
    BookmarkService.getBookmarks(knexInstance)
      .then(bookmarks => 
        res.status(200).json(bookmarks))
      .catch(console.log);
  })
  .post(express.json(), (req, res, next) => {
    const { title, rating, description, url} = req.body;
    const errors = checkEntries(title, url, description, Number(rating));
    if (errors){
      logger.error(errors);
      return res.status(400).json(errors);
    }
    const id = uuid();
    const newBookmark = {
      id,
      title,
      rating,
      description: (!!description && description.trim() !== '') ? description : '', 
      url
    };
    BOOKMARKS.push(newBookmark);
    logger.info(`bookmark with id: ${id} has been added to the database`);
    return res.status(201)
      .location(`localhost:${PORT}/bookmarks/${id}`)
      .json(newBookmark);

  });

bookmarkRouter
  .route('/:id')
  .get((req, res) => {
    const { id } = req.params;
    const knexInstance = req.app.get('db');
    BookmarkService.getBookmarkById(knexInstance, id)
      .then(bookmarkData => {
        if(bookmarkData){
          return res.status(200).json(bookmarkData);
        }
        return res.status(404).json({message:'Bookmark not found'});
      });
  })
  .delete( (req, res) => {
    const { id } = req.params;
    const index = BOOKMARKS.findIndex(bookmark => bookmark.id === Number(id));
    
    
    if(index !== -1){
      BOOKMARKS.splice(index, 1);
      logger.info(`Bookmark with index: ${index}, and id: ${id}, has been removed`);
      return res.status(204).end();
    }
    logger.info(`No bookmark with id: ${id}, could be found to delete`);
    return res.status(404).json({message:'Bookmark not found. Cannot delete'});
  });

module.exports = bookmarkRouter;