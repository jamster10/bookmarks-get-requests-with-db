'use strict';

const table = 'bookmarks';
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
  },

  addBookmark(db, newBookmark){
    return db
      .insert(newBookmark)
      .into(table)
      .returning('id');     
  },

  deleteBookmark(db, id){
    return db(table)
      .where({id})
      .delete();
  }
};

module.exports = BookmarkService;