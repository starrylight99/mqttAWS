const { express, upload } = require('../dependancies/modules')
const { fs } = require('../dependancies/modules')
const { uploadFile, deleteFiles, listFiles, uploadConfig, deleteFolders, getPlaylists, uploadSchedule } = require('../s3/functions')
const { checkAuthenticated } = require('../account/permissions')
var router = express.Router()

router.route('/upload')
    .get(checkAuthenticated, (req, res) => {
        res.render('upload', {
            authenticated: req.isAuthenticated(),
            previousPage: "/"
        })
    })
    .post(checkAuthenticated, upload.array('file'), async(req, res) => {
        const files = req.files
        console.log("upload: ", req.user)
        if (!files) {
            const error = new Error('Please choose files')
            error.httpStatusCode = 400
            return next(error)
        }

        for (let i = 0; i < files.length; i++){
            uploadFile(files[i], req.user.group)
        }
        res.redirect('/upload')
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
        listFiles(req.user.group, req, res, function(filenames, req, res) {
            res.render('playlist', {
                authenticated: req.isAuthenticated(),
                previousPage: "/command",
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
        uploadConfig(test, req.body.playlistName, req.user.group)
        res.send('success')
    })

router.route('/schedule')
    .get(checkAuthenticated, (req, res, next) => {
        getPlaylists(req.user.group, req, res, function(config, req, res) {
            for (var i in config){
                config[i] = JSON.parse(config[i])
                console.log(config[i]['playlists'])
            }
            res.render('schedule', {
                authenticated: req.isAuthenticated(),
                previousPage: "/command",
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