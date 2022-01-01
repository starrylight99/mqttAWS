const { express } = require('../dependancies/modules')
const { checkAuthenticated } = require('../account/permissions')
const { getPlaylistsandURL } = require('../s3/functions')
var router = express.Router()

router.route('/')
    .get(checkAuthenticated, (req,res) => {
        getPlaylistsandURL(req.user.group, req, res, function(config, urls, req, res) {
            res.render('viewPlaylist', {
                authenticated: req.isAuthenticated(),
                previousPage: "/command",
                config: config,
                urls: urls
            })
        })
    })


module.exports = router