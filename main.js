var express = require('express')
var mqtt = require('mqtt')
var ejs = require('ejs')
var bodyParser = require('body-parser')

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.set('view engine', 'ejs')
app.listen(port)
console.log('Server listening at port ' + port)

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
var temperature = undefined

app.route('/')
    .get((req, res) => {
        res.render('main')
    })

app.route('/temperature')
    .post(async(req, res) => {
        console.log(req.body)

        client.subscribe('temperature', (err)=> {
            if (!err) {
                client.publish('temperature', req.body.text)
                console.log('sent msg "' + req.body.text + '"')
            } else {
                console.log('failed subscribe')
                res.send('error')
            }
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        res.send(temperature)
        temperature = undefined
    })

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