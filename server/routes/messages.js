// --> /messages
const express = require('express')
const router = express()

// Setup Twilio
const twilio = require('twilio')
const client = new twilio.RestClient(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

// Phone number CSV parsing vars
const fs = require('fs')
const path = require('path')
const parse = require('csv-parse')
const csvFile = path.join(__dirname, `../numbers/${process.env.PHONE_NUMBERS_FILE || 'users'}.csv`)
const batchSize = parseInt(process.env.MESSAGE_BATCH) || 250
console.log(batchSize)
let currentNumInd = 0
let peeps // This will be the parsed list of users in the CSV
let fields = {} // This will hold the relevant fields and their corresponding index in each CSV object

// Read in the CSV file
fs.readFile(csvFile, (err, buf) => {
  if (err) {
    console.error('Error reading phone number CSV', err)
  } else {
    const recordsString = buf.toString()
    // Parse the attendee CSV file
    parse(recordsString, {}, (parseErr, output) => {
      if (parseErr) {
        console.error('Error parsing CSV', parseErr)
      } else {
        // Extract the CSV fields' columns and populate the list of users
        output[0].forEach((col, ind) => fields[col] = ind)
        peeps = output.slice(1)
      }
    });
  }
});

// Create a promise that will send a text message when resolved
const sendMessage = (message, person) => {
  // Grab relevant info from the user whom is receiving the message
  const personFields = {
    name: `${person[fields.firstName]} ${person[fields.lastName]}`,
    email: person[fields.email],
    number: person[fields.phoneNumber]
  }

  // Create and return the promise
  return new Promise((resolve, reject) => {
    return client.messages.create({
      body: message,
      to: personFields.number,  // Text this number
      from: `+1${process.env.TWILIO_NUMBER}` // Our Twilio number
    }, (err, result) => {
      if (err) {
        console.error(`Failed to send message to ${personFields.number}`)
        resolve(Object.assign({}, err, { error: true }, personFields))
      } else {
        resolve(Object.assign({}, result, { error: false }, personFields))
      }
    })
  })
}

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
      .map(user => sendMessage(req.body.text, user))

    // Send the messages and collect responses
    console.log(`Sending new batch of messages with: ${req.body.text}`)
    Promise.all(messages)
      .then(responses => {
        // Extract responses for each message attempt
        const messageResults = responses.map(response => {
          return {
            name: response.name,
            email: response.email,
            number: response.number,
            success: !response.error,
            message: response.message || 'Message sent'
          }
        })

        // Send responses
        res.status(201).send({
          responses: messageResults,
          numSent: endNumInd - currentNumInd,
          done
        })

        // Set starting index for next batch
        currentNumInd = done ? 0 : endNumInd
      })
      .catch(err => {
        next({ message: 'Issue sending messages thru Twilio' })
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
