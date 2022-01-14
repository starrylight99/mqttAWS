const { express } = require('../dependancies/modules')
const { checkAuthenticated, authRole } = require('../account/permissions')
const { ROLE } = require('../account/role')
const { getPiGroup } = require('../helper/functions')
const { getFilesandURL } = require('../s3/functions')
const e = require('express')
var router = express.Router()

router.route('/')
    .get(checkAuthenticated, (req,res) => {
        if (req.user.role != ROLE.SUPERUSER){
            getFilesandURL(req.user.group, req, res, function(filenames, url, req, res) {
                console.log(filenames)
                res.render('media', {
                    role: req.user.role,
                    authenticated: req.isAuthenticated(),
                    previousPage: "/command",
                    filenames: filenames,
                    url: url,
                })
            })
        } else {
            piGroup = getPiGroup()
            res.render('media', {
                role: req.user.role,
                authenticated: req.isAuthenticated(),
                previousPage: "/command",
                piGroup: piGroup
            })
        }
    })
    .post(checkAuthenticated, authRole(ROLE.SUPERUSER), (req,res) => {
        getFilesandURL(req.body.group, req, res, function(filenames, url, req, res) {
            console.log(filenames)
            res.send({
                filenames: filenames,
                url: url,
            })
        })
    })


module.exports = router