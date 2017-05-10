// --> /heartbeat
const express = require('express')
const router = express()

// Send the allotted text message to the next batch of users
router.get('/', (req, res) => {
  res.status(200).send('Holla back')
})

module.exports = router
