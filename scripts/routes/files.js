const { express, upload } = require('../dependancies/modules')
const { fs } = require('../dependancies/modules')
const { getPlaylist, uploadFile, deleteFile, getFiles, uploadConfig, deletePlaylist } = require('../s3/functions')
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

router.route('/delete')
    .post(checkAuthenticated, async(req, res, next) => {
        var filename = req.body.filename
        deleteFile(filename, req.user.group)
    })
    
router.route('/deletePlaylist')
    .post(checkAuthenticated, async(req, res, next) => {
        console.log(req.body)
        var delPlay = req.body.delPlay
        deletePlaylist(delPlay, req.user.group)
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
    .post(checkAuthenticated, async(req, res, next) => {
        var playlist = Array.from(req.body.playlist, x => x[0])
        var test = {
            "playlistName": req.body.playlistName,
            "playlist": playlist,
            "length": req.body.length,
            "width": req.body.width,
            "orientation": req.body.orientation
        }
        console.log(test)
        uploadConfig(test, req.body.playlistName, req.user.group)
    })

module.exports = router