const router = require('express').Router()

router.use('/heartbeat', require('./heartbeat'))
router.use('/messages', require('./messages'))

// No API routes matched --> 404
router.use((req, res) => res.status(404).end())

module.exports = router
