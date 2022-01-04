const { client } = require('./config')
const { pi } = require('../account/data')


var temperature = undefined

const piState = new Map()

pi.forEach(pie => {
    piState.set(pie.id, {
        online: false,
        schedules: []
    })
})

client.on('connect', function () {
    console.log('connected')
})

var messageHandler = (topic, message) => {
    message = message.toString().replace(/['"]+/g, '')
    console.log('Message: ' + message)
    if (message.toString().slice(0,4) == 'temp') {
        temperature = message
    } else if (message.split(' ')[0] == 'online') {
        var split_msg = message.split(' ')
        var schedules = []
        if (split_msg[2] != 'nil'){
            for (var i = 2; i < split_msg.length; i++){
                schedules.push(split_msg[i])
            }
        }
        piState.set(parseInt(message.split(' ')[1]), {online:true, schedules:schedules})
    }
    //client.end()
}

client.on('message', messageHandler)
client.on('disconnect', ()=>{
    console.log('Disconnected')
})
function getTemp(){
    return temperature
}

function resetTemp(){
    temperature = undefined
}

async function getPiState(){
    piState.forEach((pie,id) => {
        pie.online = false
        pie.schedules = []
    })
    client.subscribe('webApp', (err)=> {
        if (!err) {
            client.publish('ping', 'ping')
            console.log('sent msg "ping"')
        } else {
            console.log('failed subscribe')
        }
    })
    await new Promise(resolve => setTimeout(resolve, 500))
    client.unsubscribe('webApp', (err)=>{
        console.log('failed unsubscribe')
    })
    return piState
}

module.exports = {
    getTemp: getTemp,
    resetTemp: resetTemp,
    getPiState: getPiState,
}