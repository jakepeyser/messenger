# messenger

![Build Status](https://travis-ci.org/jakepeyser/messenger.png)

> Send a text message to a batch of users listed in a CSV

Messenger is a light-weight Node app that lets you send a single text message to a list of users. The front-end is built with [Vue.js](https://vuejs.org/) and [Twilio](https://www.twilio.com/) is used to send the SMS messages.

## Users CSV File

Users are parsed from a local CSV file, located inside the `server/numbers` folder. The app looks inside this folder for a file named `users.csv` and expects a CSV with the following column names:

| firstName | lastName |         email        |  phoneNumber |
|:---------:|:--------:|:--------------------:|:------------:|
| John      | Doe      | john.doe@example.com | 555-555-5555 |

These four columns must exist in any order inside the CSV. Any additional columns are allowed and will be ignored when parsing the file. Additionally, the phone number can be in any format as long as it constitutes a valid US phone number.

Check out the [`test.csv`](./server/numbers/test.csv) for an example of how this file might look.

### Dynamic Users File

The app looks for a file named `users.csv` by default, but another file can be used by adding the `PHONE_NUMBERS_FILE` environment variable. This allows you to segment groups of users and change between them on the fly without redeploying the application. See the [next section on environment variables](#environment-variables) for more details.

## Environment Variables

There are a number of required and optional environment variables used by the server. We use a module called [dotenv](https://www.npmjs.com/package/dotenv) to emulate these when running the app locally. It should look something like this:

```sh
TWILIO_ACCOUNT_SID=<YOUR_TWILIO_SID>
TWILIO_AUTH_TOKEN=<YOUR_TWILIO_AUTH_TOKEN>
TWILIO_NUMBER=<YOUR_TWILIO_PHONE_NUMBER>
PHONE_NUMBERS_FILE=test
MESSAGE_BATCH=250
PIN=<YOUR_MESSENGER_PIN>
```

- **`TWILIO_ACCOUNT_SID`**: An application SID is the way that a Twilio application is identified. 
- **`TWILIO_AUTH_TOKEN`**: Acts as the password for your twilio application.
- **`TWILIO_NUMBER`**: The Twilio number from which you would like to send the SMS messages.
- **`PHONE_NUMBERS_FILE`** ***(optional)***: The CSV file where users will be parsed from when the server starts. For instance, if this value was set to `prod`, the server will look for users inside the file `server/numbers/prod.csv`.
- **`MESSAGE_BATCH`**: Sometimes when we have a large number of users, we want to batch the messages into several payloads so that we can monitor any issues. This is one way to mitigate the [message queues](https://support.twilio.com/hc/en-us/articles/115002943027-Understanding-Twilio-Rate-Limits-and-Message-Queues) that are a downstream bottleneck of sending SMS messages. This value defaults to 250, but using this variable we can set it to any number we would like.
- **`PIN`**: As an extra level of security, we require a PIN for any incoming `POST /messages` request. As the app may be made available through a public endpoint, this ensures that anyone who comes across the URL cannot send messages to your users.

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

You will also need to create a `.env` file at the root of the project to store your environment variables. See the [environment variables section](#environment-variables) for more details.

### Running the app

```sh
npm run dev
```

This will start the Node server in "watch" mode, so that it automatically restarts when source files are changed. The server will start, parse the specified CSV file, and await further requests.

## Running in Prod

Running the application in Prod is similar to running it locally:

```sh
npm install
npm start
```

Also, make sure to add [the necessary environment variables](#environment-variables) to your production environment.

## API

### `GET /heartbeat`

Check to make sure the app is running

**Responses**

- **200** - Server is running smoothly
- **500** - Something is wrong

### `POST /messages`

Send a message to a batch of users

**Params**

```json
{
  "text": "Example Message",
  "pin": "SECRET_PIN"
}
```

**Responses**

- **201** - Messages were sent

	```json
	{
	  "responses": [
	    {
	      "name": "John Doe",
	      "email": "john.doe@example.com",
	      "number": "+1 (555) 555-5555",
	      "success": true,
	      "message": "Message sent"
	    },
	    {
	      "name": "Jane Doe",
	      "email": "jane.doe@example.com",
	      "number": "+12345",
	      "success": false,
	      "message": "The 'To' number +12345 is not a valid phone number."
	    }
	  ],
	  "numSent": 2,
	  "done": false
	}
	```

- **401** - Incorrect PIN
- **500** - Error occurred while sending messages

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/b5d93f6df5268e8a483b#?env%5BMessenger%5D=W3siZW5hYmxlZCI6dHJ1ZSwia2V5IjoiaG9zdCIsInZhbHVlIjoibG9jYWxob3N0OjgwODAiLCJ0eXBlIjoidGV4dCJ9LHsiZW5hYmxlZCI6dHJ1ZSwia2V5IjoibWVzc2VuZ2VyLWhvc3QiLCJ2YWx1ZSI6InRleHQtbWVzc2VuZ2VyLmhlcm9rdWFwcC5jb20iLCJ0eXBlIjoidGV4dCJ9XQ==)

## Disclaimer

Please be wary of [Twilio's SMS pricing](https://www.twilio.com/sms/pricing) when testing and running this app! Although sending an individual text is relatively cheap, the aggregate cost can often creep up on you if the number of users increases and you neglect to consider the impact on cost.

This app has only been tested to work with US mobile phone numbers, so I cannot promise it will work when texting phone numbers with other country codes!
