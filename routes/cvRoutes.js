/**
 * Database lab — routes/cvRoutes.js
 * -----------------------------
 * Maps HTTP methods + paths to controller functions.
 * Mounted at '/' in server.js, so:
 *   GET  /        → showForm
 *   POST /submit  → submitForm
 */

const express = require('express');
const router = express.Router();
const cvController = require('../controllers/cvController');

router.get('/', cvController.showForm);
router.post('/submit', cvController.submitForm);

module.exports = router;
