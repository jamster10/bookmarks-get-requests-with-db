'use strict';


module.exports = {

  checkEntries: function checkEntries(title, url, description, rating){
    let error = {};
    
    if (!rating || typeof rating !== 'number' ||  !(rating >= 1 && rating <= 5) ){
      error.rating = 'Rating is invalid';
    }

    if (!url || ( !url.toLowerCase().startsWith('http://') && !url.toLowerCase().startsWith('https://') ) ){
      error.url = 'Invalid URL. ensure it starts with http:// or https://';
    }

    if (!title || title.length > 10 || title.trim() === ''){
      error.title = 'Title either needed or too long (10 char max)';
    }
    
    if (!!description &&  description.length > 200){
      error.description = 'Description is too long';
    }
    
    if (Object.entries(error).length === 0 && error.constructor === Object){
      return undefined;
    }
    return error;
  }
};