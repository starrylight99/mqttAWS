const { express, url } = require('../dependancies/modules')
const { checkAuthenticated, authRole } = require('../account/permissions')
const { ROLE } = require('../account/role')
const { getPiGroup } = require('../helper/functions')
const { listSchedules } = require('../s3/functions')
var router = express.Router()

router.route('/')
    .get(checkAuthenticated, (req,res) => {
        if (req.user.role != ROLE.SUPERUSER){
            listSchedules(req.user.group, req, res, null, null, false, function(schedules, req, res) {
                console.log(schedules)
                res.render('listSchedules', {
                    role: req.user.role,
                    authenticated: req.isAuthenticated(),
                    previousPage: "/command",
                    schedules: schedules,
                })
            })
        } else {
            piGroup = getPiGroup()
            res.render('listSchedules', {
                role: req.user.role,
                authenticated: req.isAuthenticated(),
                previousPage: "/command",
                piGroup: piGroup
            })
        }
    })
    .post(checkAuthenticated, authRole(ROLE.SUPERUSER), (req,res) => {
        listSchedules(req.body.group, req, res, null, null, false, function(schedules, req, res) {
            console.log(schedules)
            res.send({
                schedules: schedules,
            })
        })
    })


module.exports = router