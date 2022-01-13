const { express, upload } = require('../dependancies/modules')
const { fs } = require('../dependancies/modules')
const { uploadFile, deleteFiles, listFiles, uploadConfig, deleteFolders, getPlaylists, uploadSchedule } = require('../s3/functions')
const { checkAuthenticated, authRole } = require('../account/permissions')
const { ROLE } = require('../account/role')
const { getPiGroup } = require('../helper/functions')

var router = express.Router()

router.route('/upload')
    .post(checkAuthenticated, upload.array('file'), async(req, res) => {
        const files = req.files
        console.log("upload: ", req.user)
        if (!files) {
            const error = new Error('Please choose files')
            error.httpStatusCode = 400
            return next(error)
        }
        if (req.user.role != ROLE.SUPERUSER){
            for (let i = 0; i < files.length; i++){
                uploadFile(files[i], req.user.group)
            }
        } else {
            for (let i = 0; i < files.length; i++){
                uploadFile(files[i], req.body.group)
            }
        }
        res.send('success')
    })

router.route('/deleteFiles')
    .post(checkAuthenticated, async(req, res, next) => {
        var delMedia = req.body.delMedia
        deleteFiles(delMedia, req.user.group)
        await new Promise(resolve => setTimeout(resolve, 1000))
        res.send('success')
    })
    
router.route('/deletePlaylists')
    .post(checkAuthenticated, async(req, res, next) => {
        console.log(req.body)
        var delPlay = req.body.delPlay
        deleteFolders(delPlay, req.user.group, false)
        await new Promise(resolve => setTimeout(resolve, 1000))
        res.send('success')
    })

router.route('/deleteSchedules')
    .post(checkAuthenticated, async(req, res, next) => {
        var delSched = req.body.delSched
        deleteFolders(delSched, req.user.group, true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        res.send('success')
    })

router.route('/playlist')
    .get(checkAuthenticated, (req, res, next) => {
        if (req.user.role != ROLE.SUPERUSER){
            listFiles(req.user.group, req, res, function(filenames, req, res) {
                res.render('playlist', {
                    role: req.user.role,
                    authenticated: req.isAuthenticated(),
                    previousPage: "/command",
                    filenames: filenames
                })
            })
        } else {
            piGroup = getPiGroup()
            res.render('playlist', {
                role: req.user.role,
                authenticated: req.isAuthenticated(),
                previousPage: "/command",
                piGroup: piGroup
            })
        }
    })
    .post(checkAuthenticated, authRole(ROLE.SUPERUSER), (req, res, next) => {
        listFiles(req.body.group, req, res, function(filenames, req, res) {
            res.send({
                filenames: filenames
            })
        })
    })

router.route('/createPlaylist')
    .post(checkAuthenticated, (req, res, next) => {
        var test = {
            "playlistName": req.body.playlistName,
            "aspectRatio": req.body.aspectRatio,
            "playlists": req.body.playlists,
            "screens": req.body.screens,
            "orientation": req.body.orientation,
            "splitScreen": req.body.splitScreen,
        }
        if (req.body.group != undefined) {
            uploadConfig(test, req.body.playlistName, req.body.group)
        } else {
            uploadConfig(test, req.body.playlistName, req.user.group)
        }
        res.send('success')
    })

router.route('/schedule')
    .get(checkAuthenticated, (req, res, next) => {
        if (req.user.role != ROLE.SUPERUSER){
            getPlaylists(req.user.group, req, res, function(config, req, res) {
                for (var i in config){
                    config[i] = JSON.parse(config[i])
                    console.log(config[i]['playlists'])
                }
                res.render('schedule', {
                    role: req.user.role,
                    authenticated: req.isAuthenticated(),
                    previousPage: "/command",
                    config: config
                })
            })
        } else {
            piGroup = getPiGroup()
            res.render('schedule', {
                role: req.user.role,
                authenticated: req.isAuthenticated(),
                previousPage: "/command",
                piGroup: piGroup
            })
        }
    })
    .post(checkAuthenticated, authRole(ROLE.SUPERUSER), (req, res, next) => {
        console.log(req.body.group)
        getPlaylists(req.body.group, req, res, function(config, req, res) {
            for (var i in config){
                config[i] = JSON.parse(config[i])
                console.log(config[i]['playlists'])
            }
            res.send({
                config: config
            })
        })
    })

router.route('/createSchedule')
    .post(checkAuthenticated, (req, res, next) => {
        var schedule = {
            "scheduleName": req.body.scheduleName,
            "schedule": req.body.schedule,
            "uniquePlaylist": req.body.uniquePlaylist,
            "totalScreens": req.body.totalScreens,
            "orientation": req.body.orientation,
        }
        uploadSchedule(schedule, req.user.group)
        res.send('success')
    })
module.exports = router