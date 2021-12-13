const { client } = require('./config')
const { pi } = require('../account/data')


var temperature = undefined

const piState = new Map()

pi.forEach(pie => {
    piState.set(pie.id, {
        online: false
    })
})

client.on('connect', function () {
    console.log('connected')
})

client.on('message', function (topic, message) {
    message = message.toString().replace(/['"]+/g, '')
    console.log('Message: ' + message)
    if (message.toString().slice(0,4) == 'temp') {
        temperature = message
    } else if (message.split(' ')[0] == 'online') {
        piState.set(parseInt(message.split(' ')[1]), true)
    }
    //client.end()
})

function getTemp(){
    return temperature
}

function resetTemp(){
    temperature = undefined
}
async function getPiState(){
    piState.forEach((id,pie) => {
        pie.online = false
    })

    client.subscribe('temperature', (err)=> {
        if (!err) {
            client.publish('temperature', 'ping')
            console.log('sent msg "ping"')
        } else {
            console.log('failed subscribe')
            res.send('error')
        }
    })
    await new Promise(resolve => setTimeout(resolve, 500))
    return piState
}
module.exports = {
    getTemp: getTemp,
    resetTemp: resetTemp,
    getPiState: getPiState,
}