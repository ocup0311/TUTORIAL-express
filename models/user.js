const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
  username: { type: String, required: true, min: 6, max: 18, index: true },
  password: { type: String, required: true, min: 6, max: 30 },
  first_name: String,
  family_name: String,
  email: { type: String }
})

UserSchema
  .virtual('name')
  .get(function () {
    return this.family_name + ', ' + this.first_name
  })

// Export model
module.exports = mongoose.model('User', UserSchema)
