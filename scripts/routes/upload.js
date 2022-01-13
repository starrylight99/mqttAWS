const { express }= require('../dependancies/modules')
const { checkAuthenticated } = require('../account/permissions')
const { ROLE } = require('../account/role')
const { getPiGroup } = require('../helper/functions')
var router = express.Router()

router.route('/')
    .get(checkAuthenticated, (req, res) => {
        if (req.user.role == ROLE.SUPERUSER) {
            piGroup = getPiGroup()
            res.render('upload', {
                role: req.user.role,
                authenticated: req.isAuthenticated(),
                previousPage: "/",
                piGroup: piGroup
            })
        } else {
            res.render('upload', {
                role: req.user.role,
                authenticated: req.isAuthenticated(),
                previousPage: "/",
            })
        }
    })

module.exports = router