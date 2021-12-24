const { express } = require('../dependancies/modules')
const { ROLE } = require('../account/role')
const { checkAuthenticated } = require('../account/permissions')
var router = express.Router()


router.route('/')
    .get(checkAuthenticated, (req, res) => {
        res.render('home', { 
            name: req.user.name, 
            role: req.user.role,
            authenticated: req.isAuthenticated(),
            previousPage: "/"
        })
    })
module.exports = router