var mongoose = require('mongoose'),
    // mongoose schema method
    Schema = mongoose.Schema,
    // mongoose objectId
    ObjectId = Schema.ObjectId;

var db = require('../libs/db.js');

var historySchema = new Schema({
  id: ObjectId,
  history_user_id: {
    type: String,
    trim: true
  },
  user_id: {
    type: String,
    trim: true
  },
  book_title: {
    type: String,
    trim: true
  },
  book_id: {
    type: String,
    trim: true
  },
  ownerId: {
    type: String,
    trim: true
  },
  owner: {
    type: String,
    trim: true
  },
  book_id_to_give: {
    type: String,
    trim: true
  },
  title_to_give: {
    type: String,
    trim: true
  },
  requestedBy: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    trim: true
  }
});

var HistoryS = db.model('HistoryS', historySchema);
module.exports = HistoryS;
