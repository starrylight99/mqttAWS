const { express, upload } = require('../dependancies/modules')
const { getFile, uploadFile } = require('../s3/functions')
var router = express.Router()

router.route('/upload')
    .post(upload.array('files', 12), (req, res, next) => {
        const files = req.files
        if (!files) {
            const error = new Error('Please choose files')
            error.httpStatusCode = 400
            return next(error)
        }  
        console.log(files)
        console.log(req.body)
        for (let i = 0; i < files.length; i++){
            uploadFile(files[i])
        }
        res.render('main')
    })

router.route('/retrieve')
    .post((req, res, next) => {
        console.log(req.body)
        var filename = req.body.filename
        getFile(filename)
        res.send("file req sent")
    })

module.exports = router