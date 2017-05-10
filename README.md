# messenger

> Send a text message to a batch of users listed in a CSV

Messenger is a light-weight Node app that lets you send a single text message to a list of users. The front-end is built with [Vue.js](https://vuejs.org/) and [Twilio](https://www.twilio.com/) is used to queue and send the SMS messages.

## User CSV File

TODO: Describe the CSV requirements here

## Running Locally

### Prerequisites
- [Node.js and npm](https://nodejs.org/en/)
- [Twilio account and phone number](https://www.twilio.com/phone-numbers)
  - Make sure that the phone number has SMS capabilities

### Installing

```sh
git clone https://github.com/jakepeyser/messenger.git
cd messenger
npm install
```

This will copy the project to your local machine and install all runtime dependencies.

You will also need to create a `.env` file at the root of the project to store your Twilio credentials, phone number, and runtime-specific variables. It should look something like this:

```sh
TWILIO_ACCOUNT_SID=<YOUR_TWILIO_SID>
TWILIO_AUTH_TOKEN=<YOUR_TWILIO_AUTH_TOKEN>
TWILIO_NUMBER=<YOUR_TWILIO_PHONE_NUMBER>
PHONE_NUMBERS_FILE=test
MESSAGE_BATCH=250
PIN=<YOUR_MESSENGER_PIN>
```

TODO: Make a separate .env section containing reason for each var

### Running the app

```sh
npm run dev
```

This will start the Node server in "watch" mode, so that it automatically restarts when source files are changed. The sever will start, parse the specified CSV file, and await further requests.

## Running in Prod

Running the application in Prod is similar to running it locally:

```sh
npm install
npm start
```

Also, make sure to add the environment variables to your production environment.

## API

**`GET /heartbeat`**

Check to make sure the app is running

**`POST /messages`**

Send a message to the next batch of users

Params

```json
{
  "text": "Example Message",
  "pin": "SECRET_PIN"
}
```

Responses

**201** - Messages were sent

```json
{
  "responses": [
    ...,
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "number": "+15555555555",
      "success": true,
      "message": "Message sent"
    },
    {
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "number": "+12345",
      "success": false,
      "message": "The 'To' number +12345 is not a valid phone number."
    },
    ...
  ],
  "numSent": 250,
  "done": false
}
```

**401** - Incorrect PIN

**500** - Error occurred while sending messages
