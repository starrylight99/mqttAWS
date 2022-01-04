const { express } = require('../dependancies/modules')
var { getTemp, resetTemp } = require('../mqtt/eventHandler')
var { client } = require('../mqtt/config')
const { getSchedules } = require('../s3/functions')
const { checkAuthenticated } = require('../account/permissions')
var router = express.Router()

/**
 * Message is sent in the form of "schedule {ID(of Pi)} {scheduleName}"
 */
router.route('/sendSchedule') 
    .post(checkAuthenticated, async(req, res) => {
        var schedule = req.body.schedule.toString().replace(/(\n)/gm,'')
        var msg = "schedule/" + req.body.id + '/' + schedule
        msg = msg.replaceAll('/', ' ')
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

/**
 * Message is sent in the form of "{cmd} {ID(of Pi)} {scheduleName}" 
 */
router.route('/update')
    .post(checkAuthenticated, async(req, res) => {
        var schedule = req.body.schedule
        var msg = req.body.value + "/" + req.body.id + '/' + schedule
        msg = msg.replaceAll('/', ' ')
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

module.exports = router