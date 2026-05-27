const express = require('express');
const router = express.Router();
const { checkStatus } = require('../controllers/statusController');

// Critical API used by all external software
router.get('/:email', checkStatus);

module.exports = router;
