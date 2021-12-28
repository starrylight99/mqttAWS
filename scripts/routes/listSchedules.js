const { express, url } = require('../dependancies/modules')
const { checkAuthenticated } = require('../account/permissions')
const { getSchedulesandURL, getSchedules } = require('../s3/functions')
var router = express.Router()

router.route('/')
    .get(checkAuthenticated, (req,res) => {
        // getSchedulesandURL(req.user.group, req, res, function(schedules, urls, req, res) {
        //     res.render('viewSchedule', {
        //         authenticated: req.isAuthenticated(),
        //         previousPage: "/command",
        //         schedules: JSON.stringify(schedules),
        //         urls: urls,
        //         numSchedules: schedules.length
        //     })
        // })
        getSchedules(req.user.group, req, res, null, null, false, function(schedules, req, res) {
            console.log(schedules)
            res.render('listSchedules', {
                authenticated: req.isAuthenticated(),
                previousPage: "/command",
                schedules: schedules,
            })
        })
    })

// router.route('/schedule')
//     .get(checkAuthenticated, (req,res) => {
//         var schedule = url.parse(req.url, true).query.schedule
//         console.log(schedule)
//         getSchedulesandURL(schedule, req.user.group, req, res, function(schedule, urls, req, res) {
//             console.log(schedule)
//             console.log(urls)
//             res.render('viewSchedule', {
//                 authenticated: req.isAuthenticated(),
//                 previousPage: "/command",
//                 schedule: JSON.stringify(schedule),
//                 urls: urls,
//             })
//         })
//     })

module.exports = router