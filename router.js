const express = require('express');
const router = express.Router();
const adminRoute = require('./routes/admin');
const AuthRouter = require('./routes/AuthRouter');

router.use('/admin', adminRoute); 
router.use('/auth', AuthRouter);

module.exports = router;