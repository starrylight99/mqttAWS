var express = require('express')
var mqtt = require('mqtt')
var ejs = require('ejs')
var bodyParser = require('body-parser')
const multer = require('multer')
var AWS = require('aws-sdk')
var fs = require('fs')
const { get } = require('https')
const upload = multer({ dest: "uploads/" })
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
}