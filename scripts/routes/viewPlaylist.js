const { express } = require('../dependancies/modules')
const { checkAuthenticated, authRole } = require('../account/permissions')
const { ROLE } = require('../account/role')
const { getPiGroup } = require('../helper/functions')
const { getPlaylistsandURL } = require('../s3/functions')
var router = express.Router()

router.route('/')
    .get(checkAuthenticated, (req,res) => {
        if (req.user.role != ROLE.SUPERUSER){
            getPlaylistsandURL(req.user.group, req, res, function(config, urls, req, res) {
                res.render('viewPlaylist', {
                    role: req.user.role,
                    authenticated: req.isAuthenticated(),
                    previousPage: "/command",
                    config: config,
                    urls: urls
                })
            })
        } else {
            piGroup = getPiGroup()
            res.render('viewPlaylist', {
                role: req.user.role,
                authenticated: req.isAuthenticated(),
                previousPage: "/command",
                piGroup: piGroup
            })
        }
    })
    .post(checkAuthenticated, authRole(ROLE.SUPERUSER), (req,res) => {
        getPlaylistsandURL(req.body.group, req, res, function(config, urls, req, res) {
            res.send({
                config: config,
                urls: urls
            })
        })
    })

module.exports = router