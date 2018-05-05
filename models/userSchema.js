var mongoose = require('mongoose'),
    // mongoose schema method
    Schema = mongoose.Schema,
    // mongoose objectId
    ObjectId = Schema.ObjectId,
    bcrypt = require('bcrypt-nodejs');

var db = require('../libs/db.js');

var userSchema = new Schema({
  id: ObjectId,
  name: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now,
    trim: true
  },
  updated_at: {
    type: Date,
    trim: true
  }
});

// generate hash method
userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// we need to create a model using the userSchema
// User model will take in db connection
var User = db.model('User', userSchema);

module.exports = User;
