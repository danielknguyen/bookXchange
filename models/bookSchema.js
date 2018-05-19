var mongoose = require('mongoose'),
    // mongoose schema method
    Schema = mongoose.Schema,
    // mongoose objectId
    ObjectId = Schema.ObjectId,
    bcrypt = require('bcrypt-nodejs');

var db = require('../libs/db.js');

var bookSchema = new Schema({
  id: ObjectId,
  user_id: {
    type: String,
    required: true,
    trim: true
  },
  volume_id: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  authors: [],
  publisher: {
    type: String,
    trim: true
  },
  publishedDate: {
    type: String,
    trim: true
  },
  link: {
    type: String,
    trim: true
  },
  thumbnail: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
});

var Books = db.model('Books', bookSchema);
module.exports = Books;
