const { client } = require('./config')

var temperature = undefined

client.on('connect', function () {
    console.log('connected')
})

client.on('message', function (topic, message) {
    console.log('Message: ' + message.toString())
    if (message.toString().slice(1,5) == 'temp') {
        temperature = message.toString()
    }
    //client.end()
})

module.exports = {
    temperature: temperature
}