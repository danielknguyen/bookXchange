var mongoose = require('mongoose'),
    // mongoose schema method
    Schema = mongoose.Schema,
    // mongoose objectId
    ObjectId = Schema.ObjectId;

var db = require('../libs/db.js');

var requestSchema = new Schema({
  id: ObjectId,
  user_id: {
    type: String,
    trim: true
  },
  requestedBy: {
    type: String,
    trim: true
  },
  book_id: {
    type: String,
    trim: true
  },
  title: {
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
  status: {
    type: String,
    trim: true
  }
});

var Request = db.model('Request', requestSchema);
module.exports = Request;
