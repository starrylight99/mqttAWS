const { express } = require('../dependancies/modules')
const { ROLE } = require('../account/role')
const { checkAuthenticated, authRole } = require('../account/permissions')
const { pi,piDb } = require('../account/data')
const { getPiState } = require('../mqtt/eventHandler')
const { listSchedules } = require('../s3/functions')

var router = express.Router()

router.route('/')
    .get(checkAuthenticated, authRole(ROLE.SUPERUSER),(req, res) => {
        res.render('admin', {
            authenticated: req.isAuthenticated(),
            previousPage: "/"
        })
    })

router.route('/manageDevices')
    .get(checkAuthenticated, authRole(ROLE.SUPERUSER), (req, res) => {
        res.render('adminManageDevices',{
            piArray: pi,
            authenticated: req.isAuthenticated(),
            previousPage: "/admin"
        })
    })
    .post(checkAuthenticated, authRole(ROLE.SUPERUSER), (req, res) => {
        switch (req.body.action) {
            case "Add":
                var newPi = {
                    id: pi.length == 0 ? 1 : pi[pi.length-1].id + 1,
                    name: req.body.name,
                    group: req.body.group,
                    location: req.body.location
                }
                pi.push(newPi)
                piDb.push('/' + newPi.id, newPi , false)
                res.send('success')
                break
            case "Delete":
                for (var id of req.body.piId){
                    pi.splice(pi.indexOf(pi.find(device => device.id.toString() == id)),1)
                    piDb.delete("/"+id)
                }
                res.send('success')
                break
        }
    })

router.route('/devices')
    .get(checkAuthenticated, authRole(ROLE.SUPERUSER),async(req, res) => {
        piGroup = []
        for (var device of pi){
            if (piGroup.length == 0){
                piGroup.push({
                    group: device.group,
                    location: new Set([
                        device.location
                    ])
                })
            } else {
                loop:
                    {
                        for (var group of piGroup){
                            if (group.group == device.group){
                                group.location.add(device.location)
                                break loop
                            }
                        }
                        piGroup.push({
                            group: device.group,
                            location: new Set([
                                device.location
                            ])
                        })
                    }
            }
        }
        res.render('adminDevices',{
            piArray: pi, 
            piGroup: piGroup,
            authenticated: req.isAuthenticated(),
            previousPage: "/admin"
        })
    })
    .post(checkAuthenticated, authRole(ROLE.SUPERUSER), async(req,res) => {
        console.log(req.body)
        switch(req.body.action) {
            case 'Group': // Upload new playlist
                piState = await getPiState()
                listSchedules(req.body.group, req, res, piState, pi, true, function(schedules, req, res, piState, pi) {
                    console.log(schedules)
                    console.log(piState);
                    res.send({
                        piState: [...piState],
                        schedules: schedules
                    })
                })
                break
            case 'Manage': // Manage selected pi: generate/start/stop/status
                res.redirect('/playlist/'+req.body.piId)
                break
            case 'Toggle': // Toggles power
                await toggleScreenPower(req)
                res.redirect('/admin/view')
                break
        }
    })
/* router.route('/users')
    .get(checkAuthenticated, authRole(ROLE.SUPERUSER), (req, res) => {
        res.render('adminUsers', {
            userArray: users,
            authenticated: req.isAuthenticated(),
            previousPage: "/admin"
        })
    })
    .post(checkAuthenticated, authRole(ROLE.SUPERUSER), (req, res) => {
        switch (req.body.action){
            case 'Delete':
                if (typeof(req.body.userId) == 'object'){
                    for (var id of req.body.userId){
                        users.splice(users.indexOf(users.find(user => user.id.toString() == id)),1)
                        userDb.delete("/"+id)
                    }
                } else if (typeof(req.body.userId) == 'string'){
                    users.splice(users.indexOf(users.find(user => user.id.toString() == req.body.userId)),1)
                    userDb.delete("/"+req.body.userId)
                }
                console.log(users)
                res.redirect('/admin/users')
                break
            case 'Register':
                res.redirect('/admin/register')
                break
        }
    })
router.route('/register')
    .get(checkAuthenticated, authRole(ROLE.SUPERUSER),allowConn, (req, res) => {
        res.render('adminRegister', {
            authenticated: req.isAuthenticated(),
            previousPage: "/admin/users"
        })
    })
    .post(checkAuthenticated, authRole(ROLE.SUPERUSER),checkConn, async(req, res) => {
        console.log(req.body)
        try {
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            var createUser = {
                id: users[users.length - 1].id + 1,
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
                role: req.body.role,
                group: req.body.group,
                location: req.body.location,
            }
            userDb.push('/' + createUser.id, createUser , false)
            users.push(createUser)
            res.redirect('/admin/users')
        } catch {
            res.redirect('/admin/register')
        }
    }) */
module.exports = router