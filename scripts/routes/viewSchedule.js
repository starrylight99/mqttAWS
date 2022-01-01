const { express, url } = require('../dependancies/modules')
const { checkAuthenticated } = require('../account/permissions')
const { getScheduleandURL } = require('../s3/functions')
var router = express.Router()

router.route('/:schedule')
    .get(checkAuthenticated, (req,res) => {
        var schedule = req.params.schedule
        getScheduleandURL(schedule, req.user.group, req, res, function(schedule, urls, req, res) {
            /* console.log(schedule)
            console.log(urls) */
            res.render('viewSchedule', {
                authenticated: req.isAuthenticated(),
                previousPage: "/listSchedules",
                schedule: JSON.stringify(schedule),
                urls: urls,
            })
        })
    })
    .post(checkAuthenticated, (req,res) =>{
        res.send('ok')
    })

module.exports = router