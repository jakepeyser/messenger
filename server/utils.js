// csv utils
const fs = require('fs')
const parse = require('csv-parse')

// set up twilio
const twilio = require('twilio')
const client = new twilio.RestClient(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

const parseCSV = (filename, cb) => {
  fs.readFile(filename, (err, buf) => {
    if (err) {
      console.error('Error reading CSV file', err)
      cb(err)
    } else {
      // Parse the CSV file into individual records
      parse(buf.toString(), {}, (parseErr, output) => {
        if (parseErr) {
          console.error('Error parsing CSV', parseErr)
          cb(parseErr)
        } else {
          // Extract the CSV fields' columns
          const columns = {}
          output[0].forEach((col, ind) => columns[col] = ind)
          rows = output.slice(1)
          cb(null, columns, rows)
        }
      })
    }
  })
}

// Create a promise that will send a text message when resolved
const sendMessage = (message, recipient) => {
  // Create and return the promise
  return new Promise((resolve, reject) => {
    return client.messages.create({
      body: message,
      to: recipient.phoneNumber,  // Text this number
      from: `+1${process.env.TWILIO_NUMBER}` // Our Twilio number
    }, (err, result) => {
      if (err) {
        console.error(`Failed to send message to ${recipient.phoneNumber}`)
        resolve(Object.assign({}, err, { error: true }, recipient))
      } else {
        resolve(Object.assign({}, result, { error: false }, recipient))
      }
    })
  })
}

// Convert a Message DB object to a API message response object
const messageTransform = message => ({
  name: `${message.first_name} ${message.last_name}`,
  email: message.email,
  number: message.phone_number,
  text: message.text,
  success: message.success,
  message: message.message,
  date: message.sent_at
})

module.exports = { parseCSV, sendMessage, messageTransform }
