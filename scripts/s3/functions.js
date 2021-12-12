const { fs } = require('../dependancies/modules')
var { s3 } = require('./config')

// const uploadConfig = (file, playlist) => {
//     const fileContent = fs.readFileSync(file)
//     const params = {
//         Bucket: 'maventest',
//         Key: playlist + '/config.txt', 
//         Body: fileContent
//     };

//     // Uploading files to the bucket
//     s3.upload(params, function(err, data) {
//         if (err) {
//             throw err;
//         }
//         console.log(`File uploaded successfully. ${data.Location}`);
//     });
// };

const uploadFile = (files, playlist, i, id) => {
    // Read content from the file
    const fileContent = fs.readFileSync(files.path)

    // Setting up S3 upload parameters
    const params = {
        Bucket: 'maventest',
        Key: id + '/' + playlist + '/' + i.toString() + '.' + files.originalname.split('.')[1], 
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

const getPlaylist = (playlist, id) => {
    
    const params = {
        Bucket: 'maventest',
        Prefix: id + '/' + playlist + '/', 
        Delimiter: '/'
    };

    var dir = 'downloads/' + playlist + '/'
        fs.mkdir(dir, {recursive: true}, function(err) {
            if (err) {
                if (err.code == 'EEXIST') throw(err); // Ignore the error if the folder already exists 
            } 
        }); 

    s3.listObjects(params, function(err, data) {
        if (err) {
            return 'There was an error viewing your album: ' + err.message
        }else{
            console.log(data.Contents,"<<<all content");
            data.Contents.forEach(function(obj,index){
                console.log(obj.Key,"<<<file path")
                const keyParams = {
                    Bucket: 'maventest',
                    Key: obj.Key, 
                };
                var file = fs.createWriteStream(dir + obj.Key.split('/').at(-1));
                s3.getObject(keyParams)
                    .createReadStream()
                    .on('error', (e) => {
                        console.log(e)
                        fs.rmSync(dir + obj.Key.split('/').at(-1), {
                            force: true,
                        });
                        return
                    })
                    .pipe(file)
                    .on('data', (data) => {
                        // data
                    }) 
            })
        }
    })
}

module.exports = {
    uploadFile: uploadFile,
    getPlaylist: getPlaylist,
    // uploadConfig: uploadConfig
}