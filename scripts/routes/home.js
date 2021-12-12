const { express } = require('../dependancies/modules')
var router = express.Router()

router.route('/')
    .get((req, res) => {
        res.render('main')
})

module.exports = router