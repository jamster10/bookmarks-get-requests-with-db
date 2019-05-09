'use strict';

const table = 'bookmarks'
const BookmarkService = {
  getBookmarks(db){
    return db
      .select('*')
      .from(table);
  },
  
  getBookmarkById(db, id){
    return db
      .select('*')
      .from(table)
      .first()
      .where('id', id);
  }
};

module.exports = BookmarkService;