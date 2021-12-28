const { express, upload } = require('../dependancies/modules')
const { fs } = require('../dependancies/modules')
const { getPlaylist, uploadFile, deleteFiles, getFiles, uploadConfig, deleteFolders, getPlaylists, uploadSchedule } = require('../s3/functions')
const { checkAuthenticated } = require('../account/permissions')
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

        for (let i = 0; i < files.length; i++){
            uploadFile(files[i], req.user.group)
        }
        res.render('upload', {
            authenticated: req.isAuthenticated(),
            previousPage: "/command"
        })
    })

    
router.route('/retrieve')
    .post(checkAuthenticated, async(req, res, next) => {
        var playlist = req.body.playlist
        getPlaylist(playlist, req.user.group)
    })

router.route('/deleteFiles')
    .post(checkAuthenticated, async(req, res, next) => {
        var delMedia = req.body.delMedia
        deleteFiles(delMedia, req.user.group)
    })
    
router.route('/deletePlaylists')
    .post(checkAuthenticated, async(req, res, next) => {
        console.log(req.body)
        var delPlay = req.body.delPlay
        deleteFolders(delPlay, req.user.group, false)
    })

router.route('/deleteSchedules')
    .post(checkAuthenticated, async(req, res, next) => {
        var delSched = req.body.delSched
        deleteFolders(delSched, req.user.group, true)
    })

router.route('/playlist')
    .get(checkAuthenticated, (req, res, next) => {
        getFiles(req.user.group, req, res, function(filenames, req, res) {
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
            "playlist": req.body.playlist,
            "screens": req.body.screens,
            "orientation": req.body.orientation,
        }
        uploadConfig(test, req.body.playlistName, req.user.group)
    })

router.route('/schedule')
    .get(checkAuthenticated, (req, res, next) => {
        getPlaylists(req.user.group, req, res, function(config, req, res) {
            for (var i in config){
                config[i] = JSON.parse(config[i])
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