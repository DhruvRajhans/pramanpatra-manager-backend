const express = require('express');
const configArr = require('../services/config');
const adminController = require('../controller/admin.controller');
const router = express.Router();
writeLogFile = configArr.writeLogFile;

router.get('/pramanpatra', (req, res) => { adminController.getPramanpatraData(req, res); });
router.get('/get_pramanpatra_to_edit', (req, res) => { adminController.get_pramanpatra_to_edit(req, res); });
router.post('/savePramanpatra', (req, res) => { adminController.savePramanpatra(req, res); });
router.put('/updateCertificate', (req, res) => { adminController.updateCertificate(req, res); });

router.get('/ping', (req, res) => {
    res.send('PONG');
});


module.exports = router;
