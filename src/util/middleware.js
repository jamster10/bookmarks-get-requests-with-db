'use strict';

const { NODE_ENV } = require('../config');
const winston = require('winston');


//For Morgan whitelist
const whitelist = ['http://localhost:3000', 'http://my-project.com'];

//For Winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'info.log' })
  ]
});

if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = {
  cors_Settings: {
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },

  morgan_Settings: NODE_ENV  === 'production' ? 'tiny' : 'dev',

  logger,

};