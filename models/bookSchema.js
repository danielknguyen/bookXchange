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
  title: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    required: true,
    trim: true
  },
  authors: [],
  publisher: {
    type: String,
    required: true,
    trim: true
  },
  publishedDate: {
    type: String,
    required: true,
    trim: true
  },
  link: {
    type: String,
    required: true,
    trim: true
  },
  thumbnail: {
    type: String,
    required: true,
    trim: true
  }
});

var Books = db.model('Books', bookSchema);
module.exports = Books;
