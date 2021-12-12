const { express } = require('../dependancies/modules')
const { checkAuthenticated } = require('../account/permissions')
var router = express.Router()

router.route('/')
    .get(checkAuthenticated, (req,res) => {
        res.render('test', {
            authenticated: req.isAuthenticated(),
            previousPage: '/'
        })
    })


module.exports = router