const { fs } = require('../dependancies/modules')
var { s3 } = require('./config')

const uploadFile = (files) => {
    // Read content from the file
    const fileContent = fs.readFileSync(files.path)

    // Setting up S3 upload parameters
    const params = {
        Bucket: 'maventest',
        Key: files.originalname, 
        Body: fileContent
    };

    // Uploading files to the bucket
    s3.upload(params, function(err, data) {
        if (err) {
            throw err;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
    });
};

const getFile = (filename) => {
    const params = {
        Bucket: 'maventest',
        Key: filename, 
    };
    var file = fs.createWriteStream('downloads/' + filename);
    s3.getObject(params)
        .createReadStream()
        .on('error', (e) => {
            console.log(e)
            fs.rmSync('downloads/' + filename, {
                force: true,
            });
            return
        })
        .pipe(file)
        .on('data', (data) => {
            // data
        }) 
}

module.exports = {
    uploadFile: uploadFile,
    getFile: getFile
}