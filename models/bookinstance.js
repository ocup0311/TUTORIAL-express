const mongoose = require('mongoose')
const moment = require('moment')

const Schema = mongoose.Schema

const BookInstanceSchema = new Schema(
  {
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true }, // reference to the associated book
    imprint: { type: String, required: true },
    status: { type: String, required: true, enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'], default: 'Maintenance' },
    due_back: { type: Date, default: Date.now }
  }
)

// Virtual for bookinstance's URL
BookInstanceSchema
  .virtual('statusName')
  .get(function () {
    const status = this.status
    let x
    switch (status) {
      case 'Available':
        x = '可借閱'
        break
      case 'Maintenance':
        x = '書本保養中'
        break
      case 'Loaned':
        x = '已被借閱'
        break
      case 'Reserved':
        x = '已被預約'
        break
      default:
        x = 'No value found'
    }
    return x
  })

BookInstanceSchema
  .virtual('url')
  .get(function () {
    return '/catalog/bookinstance/' + this._id
  })

BookInstanceSchema
  .virtual('dueBackFormatted')
  .get(function () {
    return moment(this.due_back).format('MMMM Do, YYYY')
  })

BookInstanceSchema
  .virtual('dueBackForFillIn')
  .get(function () {
    return moment(this.due_back).format('YYYY-MM-DD')
  })

// Export model
module.exports = mongoose.model('BookInstance', BookInstanceSchema)
