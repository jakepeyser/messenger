// --> /messages
const express = require('express')
const router = express()

// Get Message model
const db = require('../../db/')
const Message  = db.model('message')

// Vars used by API handlers
const { parseCSV, sendMessage, messageTransform } = require('../utils')
let peeps, fields
const userFields = [ 'firstName', 'lastName', 'email', 'phoneNumber' ]
const batchSize = parseInt(process.env.MESSAGE_BATCH) || 250
let currentNumInd = 0

// Read in the users CSV file
const path = require('path')
const csvFile = path.join(__dirname, `../numbers/${process.env.PHONE_NUMBERS_FILE || 'users'}.csv`)
parseCSV(csvFile, (err, cols, users) => {
  if (!err) {
    fields = cols
    peeps = users
  }
})

// Retrieve all the messages sent so far, in reverse chronological order
router.get('/', (req, res, next) => {
  Message.findAll({ order: [['sent_at', 'DESC']] })
    .then(logs => logs.map(messageTransform))
    .then(messages => res.send(messages))
    .catch(next)
})

// Send the allotted text message to the next batch of users
router.post('/', (req, res, next) => {
  // Make sure input PIN is correct
  if (req.body.pin === process.env.PIN) {
    // Figure out batch to send for this call
    let done = false
    let endNumInd = currentNumInd + batchSize
    if (endNumInd >= peeps.length) {
      done = true
      endNumInd = peeps.length
    }

    // Prepare messages for each number in the current batch
    const messages = peeps
      .slice(currentNumInd, endNumInd)
      .map(user => {
        let person = {}
        userFields.forEach(col => person[col] = user[fields[col]])
        return sendMessage(req.body.text, person)
      })

    // Send the messages and collect responses
    console.log(`Sending new batch of messages with: ${req.body.text}`)
    Promise.all(messages)
      .then(responses => {
        // Save message and corresponding response to the DB
        const newMessages = responses.map(response => {
          return Message.create({
            first_name: response.firstName,
            last_name: response.lastName,
            email: response.email,
            phone_number: response.phoneNumber,
            text: req.body.text,
            success: !response.error,
            message: response.message
          })
        })
        return Promise.all(newMessages)
      })
      .then(logs => {
        // Send responses
        res.status(201).send({
          responses: logs.map(messageTransform),
          numSent: endNumInd - currentNumInd,
          done
        })

        // Set starting index for next batch
        currentNumInd = done ? 0 : endNumInd
      })
      .catch(err => {
        next({ message: 'Issue sending/saving messages' })
      })
  } else {
    // PIN sent with request was incorrect
    next({
      status: 401,
      message: 'Invalid PIN'
    })
  }
})

module.exports = router;
