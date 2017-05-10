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

// Logging, static, and body-parser middleware
app.use(morgan('dev'))
app.use(bodyParser.json()) // would be for AJAX requests

// Handle API and all browser requests
app.use('/api', require('./routes'))
app.get('/*', (req, res) => res.sendFile(path.join(__dirname, '../index.html')))

// Error handler
app.use((err, req, res, next) => {
  console.error(chalk.red(err))
  if (err.stack) console.error(chalk.red(err.stack))
  res.status(err.status || 500).send(err.message || 'Internal server error.')
});

// Start server
app.listen(PORT, () =>
  console.log(chalk.blue(`Server started on port ${chalk.magenta(PORT)}`))
);
