const Sequelize = require('sequelize')
const db = require('../db')

const Message = db.define('message', {
  first_name: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  last_name: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true,
      isEmail: true
    }
  },
  phone_number: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  success: {
    type: Sequelize.BOOLEAN,
    validate: {
      notEmpty: true
    }
  },
  sent_at: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  },
  message: {
    type: Sequelize.STRING,
    defaultValue: 'Message Sent'
  }
}, {
  underscored: true,
  timestamps: false
})


module.exports = Message;
