const { client } = require('./config')
const { pi } = require('../account/data')


var temperature = undefined

const piState = new Map()
var schedules = []

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
        if (split_msg[2] != 'nil'){
            playlistName = split_msg[2]
            if (split_msg.length > 2) {
                for (var i = 3; i < split_msg.length; i++){
                    playlistName += " " + split_msg[i]
                }
            }
            console.log(playlistName)
            schedules.push(playlistName)
            console.log(schedules)
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
    schedules = []
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