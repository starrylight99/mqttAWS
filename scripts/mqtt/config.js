const { mqtt } = require('../dependancies/modules')

const address = 'mqtts://18.141.182.21'
const user = {
    username: 'maventest',
    password: '12345',
    protocol: 'mqtts',
    ca: 'Downloads/ca.crt',
    protocolVersion: 4,
    keepalive: 60,
    reconnectPeriod: 1000,
    clean: true,
    encoding: 'utf8',
    rejectUnauthorized: false
}

var client = mqtt.connect(address, user)

module.exports = {
    client: client,
}