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
        client.subscribe('temperature', (err)=> {
            if (!err) {
                client.publish('temperature', req.body.text/*  + ' ' + req.user.id */)
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

router.route('/schedule')
    .get(checkAuthenticated, (req, res, next) => {
        getSchedules(req.user.group, req, res, function(schedules, req, res) {
            res.render('sendSchedule', {
                authenticated: req.isAuthenticated(),
                previousPage: "/command",
                schedules: schedules
            })
        })
    })

router.route('/sendSchedule') // TODO: finish command to send to pi, depending on configuration, copy paste get playlist and download schedule
    .post(checkAuthenticated, async(req, res) => {
        console.log(req.body.schedule)
        client.subscribe('schedule', (err) => {
            if (!err) {
                client.publish('schedule', "test" )
            }
        })
    })

module.exports = router