const { express } = require('../dependancies/modules')
const { checkAuthenticated } = require('../account/permissions')
const { getSchedulesandURL } = require('../s3/functions')
var router = express.Router()

router.route('/')
    .get(checkAuthenticated, (req,res) => {
        getSchedulesandURL(req.user.group, req, res, function(schedules, urls, req, res) {
            res.render('viewSchedule', {
                authenticated: req.isAuthenticated(),
                previousPage: "/command",
                schedules: JSON.stringify(schedules),
                urls: urls,
                numSchedules: schedules.length
            })
        })
    })


module.exports = router