const express = require('express');
require('dotenv').config();
const configArr = require('./services/config');
const app = configArr.app;
const bodyParser = require('body-parser');


const router = require('./router');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
myCache = configArr.myCache;
writeLogFile = configArr.writeLogFile;
app.use(bodyParser.json());
app.use(cors({ origin: '*', credentials: true }));
app.use(cookieParser());
app.use(session({ secret: 'cmpe_273_secure_string', resave: false, saveUninitialized: true, duration: 30 * 60 * 1000, activeDuration: 5 * 60 * 1000 }));
app.use(express.static(__dirname + '/'));
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || "*");
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
    res.setHeader('Cache-Control', 'no-cache');
    next();
});
const PORT = process.env.PORT || 5008;

app.use('/', router);

app.get('/ping', (req, res) => {
    res.send('PONG');
});

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
})

module.exports = app;