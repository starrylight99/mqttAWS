var express = require('express')
var mqtt = require('mqtt')
var ejs = require('ejs')
var bodyParser = require('body-parser')
const multer = require('multer')
var AWS = require('aws-sdk')
var fs = require('fs')
const { get } = require('https')
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image') || file.mimetype.startsWith('video')) {
    cb(null, true);
  } else {
    cb(new Error('Not a media file! Please upload images/videos only.', 400), false);
  }
};
const upload = multer({ dest: "uploads/", fileFilter: multerFilter })
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const expressLayouts = require('express-ejs-layouts')

module.exports = {
    express: express,
    mqtt: mqtt,
    ejs: ejs,
    bodyParser: bodyParser,
    AWS: AWS,
    upload: upload,
    get: get,
    fs: fs,
    expressLayouts: expressLayouts,
    bcrypt: bcrypt,
    passport: passport,
    flash: flash,
    session: session,
    methodOverride: methodOverride,
}