
const NodeCache = require("node-cache");
module.exports.fs = require("fs");
var fs = module.exports.fs;
module.exports.multer = require("multer");
module.exports.path = require("path");
module.exports.session = require('express-session');
module.exports.myCache = new NodeCache();
var { pool } = require('../services/db.service');
module.exports.pool = pool;
module.exports.cacheTimeout = 3000000;
module.exports.https = require('https');
const express = require('express');
var rootPath = "../";

var app = express();
module.exports.app = app;

module.exports.writeLogFile = (logData, errorFunction) => {
    var today = new Date();
    var dateTime = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate() + ' ' + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var LogDataStr = '\n----------------' + dateTime + '------------------\n';
    LogDataStr += 'Error in the function: ' + errorFunction + '\n';
    LogDataStr += JSON.stringify(logData);
    var logStream = fs.createWriteStream(rootPath + '/logData.txt', { flags: 'a' });
    logStream.write(LogDataStr);
    logStream.end('\n----***---\n');
}
module.exports.handleError = (err, res) => { res.status(500).contentType("text/plain").end("Oops! Something went wrong!"); };