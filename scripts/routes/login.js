const { express } = require('../dependancies/modules')
var router = express.Router()
const { checkNotAuthenticated} = require('../account/permissions')
const { passport } = require('../dependancies/modules')


router.route('/')
    .get(checkNotAuthenticated, (req, res) => {
        res.render('login' ,{
            authenticated: req.isAuthenticated(),
        })
    })
    .post(checkNotAuthenticated, passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }))


module.exports = router