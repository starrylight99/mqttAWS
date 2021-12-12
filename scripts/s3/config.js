const modules = require('../dependancies/modules');
const { AWS } = require('../dependancies/modules')
const config = require('./config.json')

const s3Config = {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region,
}

var s3 = new AWS.S3(s3Config);

module.exports = { s3 }