const { express } = require('../dependancies/modules')
const { checkAuthenticated } = require('../account/permissions')
const { getFilesandURL } = require('../s3/functions')
var router = express.Router()

router.route('/')
    .get(checkAuthenticated, (req,res) => {
        getFilesandURL(req.user.group, req, res, function(filenames, url, req, res) {
            res.render('media', {
                authenticated: req.isAuthenticated(),
                previousPage: "/command",
                filenames: filenames,
                url: url,
            })
        })
    })


module.exports = router