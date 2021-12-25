const { config } = require('aws-sdk');
const { fs } = require('../dependancies/modules')
var { s3 } = require('./config')


const uploadSchedule = (schedule, group) => {
    console.log(schedule.scheduleName)
    fs.createWriteStream('uploads/'+ group + '_' + schedule.scheduleName + '_schedule.json');
    fs.writeFileSync('uploads/'+ group + '_' + schedule.scheduleName + '_schedule.json', JSON.stringify(schedule))
    var fileContent = fs.readFileSync('uploads/'+ group + '_' + schedule.scheduleName + '_schedule.json');
    const params = {
        Bucket: 'maventest',
        Key: group + '/schedules/' + schedule.scheduleName + '_schedule.json', 
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

const uploadConfig = (file, playlistName, group) => {
    fs.createWriteStream('uploads/'+ group + '_' + playlistName + '_config.json');
    fs.writeFileSync('uploads/'+ group + '_' + playlistName + '_config.json', JSON.stringify(file))
    var fileContent = fs.readFileSync('uploads/'+ group + '_' + playlistName + '_config.json');
    const params = {
        Bucket: 'maventest',
        Key: group + '/' + playlistName + '/' + playlistName + '_config.json', 
        Body: fileContent
    };

    // Uploading files to the bucket
    s3.upload(params, function(err, data) {
        if (err) {
            throw err;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
    });

    var playlistSet = []
    for (let i = 0; i < file.playlist.length; i++){
        playlistSet.push(file.playlist[i][0])
    }
    playlistSet = Array.from(new Set(playlistSet))
    for (let i = 0; i < playlistSet.length; i++){
        var filename = group + '/media/' + playlistSet[i]
        const fileParams = {
            Bucket: 'maventest',
            CopySource: 'maventest/' + filename,
            Key: group + '/' + playlistName + '/' + playlistSet[i],
        } 
        s3.copyObject(fileParams, function (err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log('Inserted');
            }
        });
    }
};

const uploadFile = (files, group) => {
    // Read content from the file
    const fileContent = fs.readFileSync(files.path)

    // Setting up S3 upload parameters
    const params = {
        Bucket: 'maventest',
        Key: group + '/media/' + files.originalname, 
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

const getFiles = (group, req, res, callback) => {
    const params = {
        Bucket: 'maventest',
        Prefix: group + '/media/', 
        Delimiter: '/'
    };
    s3.listObjects(params, function(err, data) {
        if (err) {
            console.log(err.message)
            return 'There was an error viewing your album: ' + err.message
        } else{
            //console.log(data)
            var filenames = []
            data.Contents.forEach(function(obj){
                filenames.push(obj.Key.split('/').at(-1))
            })
            callback(filenames, req, res)
        }
    })
}

const getSchedules = (group, req, res, piState, pi, callback) => {
    const params = {
        Bucket: 'maventest',
        Prefix: group + '/schedules/', 
        Delimiter: '/'
    };
    s3.listObjects(params, function(err, data) {
        if (err) {
            console.log(err.message)
            return 'There was an error viewing your album: ' + err.message
        } else{
            //console.log(data)
            var schedules = []
            data.Contents.forEach(function(obj){
                schedules.push(obj.Key.split('/').at(-1).replace('_schedule.json', ''))
            })
            callback(schedules, req, res, piState, pi)
        }
    })
}

var getObject = function(params) {
    return new Promise(function(success, reject) {
        s3.getObject(params,
            function (error, data) {
                if(error) {
                    reject(error);
                } else {
                    success(data);
                }
            }
        );
    });
}

const getPlaylists = (group, req, res, callback) => {
    const params = {
        Bucket: 'maventest',
        Prefix: group + '/', 
        Delimiter: '/'
    }
    s3.listObjectsV2(params, function(err, data) {
        if (err) {
            console.log(err.message)
            return 'There was an error viewing your album: ' + err.message
        } else{
            //console.log(data)
            // data.CommonPrefixes.forEach(function(obj){
            //     filenames.push(obj.Key.split('/').at(-1))
            // })
            promises = []
            for (var i = 0; i < data.CommonPrefixes.length; i++){
                var name = data.CommonPrefixes[i].Prefix.split('/')[1]
                if ((name != 'media') && (name != 'schedules')){
                    var configParams = {
                        Bucket: 'maventest',
                        Key: group + '/' + name + '/' + name + '_config.json', 
                    }
                    promises.push(getObject(configParams))
                }
            }
            var config = []
            Promise.all(promises)
                .then(function(results){
                    for (var i in results){
                        var data = results[i].Body.toString()
                        config.push(data)
                    }
                    callback(config, req, res)
                })
        }
    })
}

const deletePlaylist = (playlist, group) => {
    const params = {
        Bucket: 'maventest',
        Prefix: group + '/' + playlist + '/', 
        Delimiter: '/'
    };
    s3.listObjects(params, function(err, data) {
        if (err) {
            return 'There was an error viewing your album: ' + err.message
        }else{
            const delParams = {
                Bucket: 'maventest',
                Delete: {Objects: []}, 
            };
            console.log(data.Contents,"<<<all content");
            data.Contents.forEach(function(obj,index){
                console.log(obj.Key,"<<<file path")
                delParams.Delete.Objects.push({Key: obj.Key})
            })
            s3.deleteObjects(delParams, function(err, data) {
                if (err) console.log(err, err.stack);
                else console.log('delete', data);
            })
        }
    })
}

const getPlaylist = (playlist, group) => {
    const params = {
        Bucket: 'maventest',
        Prefix: group + '/' + playlist + '/', 
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

const deleteFile = (filename, group) => {
    const params = {
        Bucket: 'maventest',
        Key: group + '/media/' + filename, 
    };

    s3.deleteObject(params, function(err, data) {
        if (err){
            console.log('err: ', err.message)
            return 'Error deleting file: ' + err.message
        }
        else{
            console.log('data: ', data)
        }
    })
}

module.exports = {
    uploadFile: uploadFile,
    getPlaylist: getPlaylist,
    deleteFile: deleteFile,
    getFiles: getFiles,
    uploadConfig: uploadConfig,
    deletePlaylist: deletePlaylist,
    getPlaylists: getPlaylists,
    uploadSchedule: uploadSchedule,
    getSchedules: getSchedules,
}