const { express, upload } = require('../dependancies/modules')
const { fs } = require('../dependancies/modules')
const { getPlaylist, uploadFile } = require('../s3/functions')
const { checkAuthenticated } = require('../account/permissions')
var router = express.Router()

// router.route('/upload')
//     .post(checkAuthenticated, upload.array('files', 12), (req, res, next) => {
//         const files = req.files
//         if (!files) {
//             const error = new Error('Please choose files')
//             error.httpStatusCode = 400
//             return next(error)
//         }  
//         console.log(files)
//         console.log(req.body)
//         for (let i = 0; i < files.length; i++){
//             //uploadFile(files[i])
//         }
//         res.render('main', {
//             authenticated: req.isAuthenticated(),
//         })
//     })

router.route('/upload')
    .post(checkAuthenticated, upload.array('file'), async(req, res) => {
        const files = req.files
        console.log(files)
        if (!files) {
            const error = new Error('Please choose files')
            error.httpStatusCode = 400
            return next(error)
        }

        for (let i = 0; i < files.length; i++){
            uploadFile(files[i], req.body.playlistName, i, req.user.id)
        }
        res.render('upload', {
            authenticated: req.isAuthenticated(),
            previousPage: "/command"
        })
    })

    
router.route('/retrieve')
    .post(checkAuthenticated, async(req, res, next) => {
        console.log(req.body)
        var playlist = req.body.filename
        getPlaylist(playlist, req.user.id)
    })
    

module.exports = router