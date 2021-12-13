const { express } = require('../dependancies/modules')
const { ROLE } = require('../account/role')
const { checkAuthenticated } = require('../account/permissions')
const { pi } = require('../account/data')
const { getPiState } = require('../mqtt/eventHandler')
var router = express.Router()


router.route('/')
    .get(checkAuthenticated, async(req, res) => {
        piState = await getPiState()
        console.log(piState);
        res.render('devices', { 
            user: req.user,
            piArray: pi,
            piState: piState,
            authenticated: req.isAuthenticated(),
            previousPage: "/"
        })
    })

module.exports = router