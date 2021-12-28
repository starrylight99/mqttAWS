const { express } = require('../dependancies/modules')
const { ROLE } = require('../account/role')
const { checkAuthenticated } = require('../account/permissions')
const { pi } = require('../account/data')
const { getPiState } = require('../mqtt/eventHandler')
var router = express.Router()
const { getSchedules } = require('../s3/functions')


router.route('/')
    .get(checkAuthenticated, async(req, res) => {
        piState = await getPiState()
        getSchedules(req.user.group, req, res, piState, pi, true, function(schedules, req, res, piState, pi) {
            console.log(schedules)
            console.log(piState);
            res.render('devices', { 
                user: req.user,
                piArray: pi,
                piState: piState,
                authenticated: req.isAuthenticated(),
                previousPage: "/",
                schedules: schedules
            })
        })
        
    })

module.exports = router