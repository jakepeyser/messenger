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
const csvFile = path.join(__dirname, `../numbers/${process.env.PHONE_NUMBERS_FILE}.csv`)
const batchSize = parseInt(process.env.MESSAGE_BATCH)
let currentNumInd = 0
let peeps // This will be the parsed list of users in the CSV
const fields = {} // This will hold the relevant fields and their corresponding index in each CSV object

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
        // Extract the relevant fields and populate the list of users
        // TODO: Extract fields more efficiently
        fields.firstName = output[0].findIndex(col => col === 'firstName')
        fields.lastName = output[0].findIndex(col => col === 'lastName')
        fields.email = output[0].findIndex(col => col === 'email')
        fields.phoneNumber = output[0].findIndex(col => col === 'phoneNumber')
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
        // Extract responses from each message attempt
        const messageResults = responses.map(response => {
          let success, message
          if (response.error) {
            success = false
            message = response.message
          } else {
            success = true
            message = 'Message sent'
          }
          // TODO: Consolidate setting these vars ^^^
          return {
            name: response.name,
            email: response.email,
            number: response.number,
            success, message
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
        console.error('Error occured while sending messages')
        // TODO: Propagate to error handler instead
        res.sendStatus(500)
      })
  } else {
    // PIN sent with request was incorrect
    // TODO: Propagate to error handler instead
    res.status(401).send('Invalid PIN')
  }
})

module.exports = router;
