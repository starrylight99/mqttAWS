const { express } = require('../dependancies/modules')
var { getTemp, resetTemp } = require('../mqtt/eventHandler')
var { client } = require('../mqtt/config')
const { getSchedules } = require('../s3/functions')
const { checkAuthenticated } = require('../account/permissions')
var router = express.Router()

router.route('/temperature')
    .post(checkAuthenticated, async(req, res) => {
        console.log(req.body)
        resetTemp()
        client.subscribe('webApp', (err)=> {
            if (!err) {
                client.publish('ping', req.body.text/*  + ' ' + req.user.id */)
                console.log('sent msg "' + req.body.text + '"')
            } else {
                console.log('failed subscribe')
                res.send('error')
            }
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        var message = getTemp()
        console.log(message)
        res.send(message)
    })

router.route('/sendSchedule') 
    .post(checkAuthenticated, async(req, res) => {
        var schedule = req.body.schedule.toString().replace(/(\n)/gm,'')
        var msg = "schedule/" + req.body.id + '/' + schedule
        msg = msg.replace(/ /g,'').replaceAll('/', ' ')
        console.log(msg)
        client.subscribe('webApp', (err) => {
            if (!err) {
                client.publish('schedule', msg)
                console.log('sent msg "' + msg + '"')
            }else {
                console.log('failed subscribe')
                res.send('error')
            }
        })
    })

router.route('/delete')
    .post(checkAuthenticated, async(req, res) => {
        var schedule = req.body.schedule.toString().replace(/(\n)/gm,'')
        var msg = "delete/" + req.body.id + '/' + schedule
        msg = msg.replace(/ /g,'').replaceAll('/', ' ')
        console.log(msg)
        client.subscribe('webApp', (err) => {
            if (!err) {
                client.publish('delete', msg)
                console.log('sent msg "' + msg + '"')
            }else {
                console.log('failed subscribe')
                res.send('error')
            }
        })
    })

module.exports = router