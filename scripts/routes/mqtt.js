const { express } = require('../dependancies/modules')
var { temperature } = require('../mqtt/eventHandler')
var { client } = require('../mqtt/config')
var router = express.Router()

router.route('/temperature')
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


module.exports = router