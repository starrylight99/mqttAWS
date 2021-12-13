const { express } = require('../dependancies/modules')
var { getTemp, resetTemp } = require('../mqtt/eventHandler')
var { client } = require('../mqtt/config')
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


module.exports = router