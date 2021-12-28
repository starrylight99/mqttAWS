const { express, url } = require('../dependancies/modules')
const { checkAuthenticated } = require('../account/permissions')
const { getSchedulesandURL } = require('../s3/functions')
var router = express.Router()

router.route('/')
    .get(checkAuthenticated, (req,res) => {
        var schedule = url.parse(req.url, true).query.schedule
        console.log(schedule)
        getSchedulesandURL(schedule, req.user.group, req, res, function(schedule, urls, req, res) {
            console.log(schedule)
            console.log(urls)
            res.render('viewSchedule', {
                authenticated: req.isAuthenticated(),
                previousPage: "/command",
                schedule: JSON.stringify(schedule),
                urls: urls,
            })
        })
    })

module.exports = router