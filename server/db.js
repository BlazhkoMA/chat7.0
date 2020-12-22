const {Schema, model} = require('mongoose')

const db = new Schema({
  roomId: {
    type: String,
    required: true
  },
  users: {
    type: Array,
    required: true
  },
  messages: {
    type: Array
  }
})


module.exports = function () {
  return model('Db', db)
}
