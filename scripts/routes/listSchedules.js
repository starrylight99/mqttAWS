const { express, url } = require('../dependancies/modules')
const { checkAuthenticated } = require('../account/permissions')
const { listSchedules } = require('../s3/functions')
var router = express.Router()

router.route('/')
    .get(checkAuthenticated, (req,res) => {
        listSchedules(req.user.group, req, res, null, null, false, function(schedules, req, res) {
            console.log(schedules)
            res.render('listSchedules', {
                authenticated: req.isAuthenticated(),
                previousPage: "/command",
                schedules: schedules,
            })
        })
    })



module.exports = router