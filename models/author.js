const mongoose = require('mongoose')
const moment = require('moment')

const Schema = mongoose.Schema

const AuthorSchema = new Schema(
  {
    first_name: { type: String, required: true, max: 100 },
    family_name: { type: String, required: true, max: 100 },
    date_of_birth: { type: Date },
    date_of_death: { type: Date }
  }
)

AuthorSchema
  .virtual('birthDay')
  .get(function () {
    if (this.date_of_birth) {
      return moment(this.date_of_birth).format('MMMM Do, YYYY')
    } else {
      return ''
    }
  })

AuthorSchema
  .virtual('deathDay')
  .get(function () {
    if (this.date_of_death) {
      return moment(this.date_of_death).format('MMMM Do, YYYY')
    } else {
      return ''
    }
  })

AuthorSchema
  .virtual('birthDayForFillIn')
  .get(function () {
    if (this.date_of_birth) {
      return moment(this.date_of_birth).format('YYYY-MM-DD')
    } else {
      return ''
    }
  })

AuthorSchema
  .virtual('deathDayForFillIn')
  .get(function () {
    if (this.date_of_death) {
      return moment(this.date_of_death).format('YYYY-MM-DD')
    } else {
      return ''
    }
  })

// Virtual for author's full name
AuthorSchema
  .virtual('name')
  .get(function () {
    return this.family_name + ', ' + this.first_name
  })

// Virtual for author's lifespan
AuthorSchema
  .virtual('lifespan')
  .get(function () {
    return (this.date_of_death.getYear() - this.date_of_birth.getYear()).toString()
  })

// Virtual for author's URL
AuthorSchema
  .virtual('url')
  .get(function () {
    return '/catalog/author/' + this._id
  })

// Export model
module.exports = mongoose.model('Author', AuthorSchema)
