const chalk = require('chalk')
const express = require('express')
const app = express()
const morgan = require('morgan')
const bodyParser = require('body-parser')
const path = require('path')
const PORT = process.env.PORT || 8080
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

// React to an unsecure request over http
if (process.env.NODE_ENV === 'production') {
  app.use('*', function(req, res, next) {
    // Continue if SSL
    if (req.headers['x-forwarded-proto'] === 'https')
      next()
    // Redirect GET requests to https
    else if (req.method === 'GET')
      res.redirect(`https://${req.headers.host}${req.url}`)
    // Return error to users for all other requests
    else {
      next({
        status: 403,
        message: 'SSL required'
      })
    }
  })
}

// Logging, static, and body-parser middleware
app.use(morgan('dev'))
app.use(bodyParser.json()) // would be for AJAX requests

// Handle API and all browser requests
app.use('/api', require('./routes'))
app.get('/*', (req, res) => res.sendFile(path.join(__dirname, '../index.html')))

// Error handler
app.use((err, req, res, next) => {
  if (err.message) console.error(chalk.red(`Error: ${err.message}`))
  if (err.stack) console.error(chalk.red(err.stack))
  res.status(err.status || 500).send(err.message || 'Internal server error.')
});

// Start server
app.listen(PORT, () =>
  console.log(chalk.blue(`Server started on port ${chalk.magenta(PORT)}`))
);
