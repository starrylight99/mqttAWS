const { config } = require('aws-sdk');
const { fs, mime } = require('../dependancies/modules')
var { s3 } = require('./config')

var listObject = function(params) {
    return new Promise(function(success, reject) {
        s3.listObjectsV2(params,
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

const uploadSchedule = (schedule, group) => {
    console.log(schedule.scheduleName)
    
    var promises = []
    for (var i = 0; i < schedule.uniquePlaylist.length; i++){
        const playlistParams = {
            Bucket: 'maventest1',
            Prefix: group + '/' + schedule.uniquePlaylist[i] + '/', 
            Delimiter: '/'
        };
        promises.push(listObject(playlistParams))
    }
    Promise.all(promises)
        .then(function(results){
            var mediaNames = {}
            var playlistMedia = {}
            for (var i in results){
                playlistMedia[schedule.uniquePlaylist[i]] = []
                console.log(1)
                console.log(playlistMedia)
                results[i].Contents.forEach(function(obj){
                    var filepath = obj.Key
                    const fileParams = {
                        Bucket: 'maventest1',
                        CopySource: 'maventest1/' + filepath,
                        Key: group + '/schedules/'+ schedule.scheduleName + '/' + schedule.uniquePlaylist[i] + '/' + filepath.split('/').slice(-1)[0],
                    }
                    console.log(2)
                    console.log(playlistMedia)
                    if (filepath.split('/').slice(-1)[0].split('.').slice(-1)[0] != 'json'){
                        playlistMedia[schedule.uniquePlaylist[i]].push(filepath.split('/').slice(-1)[0])
                    }
                    mediaNames[filepath.split('/').slice(-1)[0]] = schedule.uniquePlaylist[i]
                    s3.copyObject(fileParams, function (err, data) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Inserted');
                        }
                    });
                })
            }
            schedule['mediaNames'] = mediaNames
            schedule['playlistMedia'] = playlistMedia
            console.log(schedule)
            fs.createWriteStream('uploads/'+ group + '_' + schedule.scheduleName + '_schedule.json');
            fs.writeFileSync('uploads/'+ group + '_' + schedule.scheduleName + '_schedule.json', JSON.stringify(schedule))
            var fileContent = fs.readFileSync('uploads/'+ group + '_' + schedule.scheduleName + '_schedule.json');
            const params = {
                Bucket: 'maventest1',
                Key: group + '/schedules/' + schedule.scheduleName + '/' + schedule.scheduleName + '_schedule.json', 
                Body: fileContent
            };

            // Uploading files to the bucket
            s3.upload(params, function(err, data) {
                if (err) {
                    throw err;
                }
                console.log(`File uploaded successfully. ${data.Location}`);
            });
        })
};

const uploadConfig = (file, playlistName, group) => {
    var playlistSet = []
    for (let i = 0; i < file.playlist.length; i++){
        playlistSet.push(file.playlist[i][0])
    }
    playlistSet = Array.from(new Set(playlistSet))
    for (let i = 0; i < playlistSet.length; i++){
        var filename = group + '/media/' + playlistSet[i]
        const fileParams = {
            Bucket: 'maventest1',
            CopySource: 'maventest1/' + filename,
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
    file['mediaNames'] = playlistSet
    fs.createWriteStream('uploads/'+ group + '_' + playlistName + '_config.json');
    fs.writeFileSync('uploads/'+ group + '_' + playlistName + '_config.json', JSON.stringify(file))
    var fileContent = fs.readFileSync('uploads/'+ group + '_' + playlistName + '_config.json');
    const params = {
        Bucket: 'maventest1',
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
};

const uploadFile = (files, group) => {
    // Read content from the file
    const fileContent = fs.readFileSync(files.path)

    // Setting up S3 upload parameters
    const params = {
        Bucket: 'maventest1',
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
        Bucket: 'maventest1',
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

const getFilesandURL = (group, req, res, callback) => {
    const params = {
        Bucket: 'maventest1',
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
            var url = []
            data.Contents.forEach(function(obj){
                var fileParams = {
                    Bucket: 'maventest1',
                    Key: obj.Key,
                    ResponseContentType: mime.lookup(obj.Key)
                }
                url.push(s3.getSignedUrl('getObject', fileParams))
                filenames.push(obj.Key.split('/').at(-1))
            })
            callback(filenames, url, req, res)
        }
    })
}

const getSchedules = (group, req, res, piState, pi, callback) => {
    const params = {
        Bucket: 'maventest1',
        Prefix: group + '/schedules/', 
        Delimiter: '/'
    };
    s3.listObjectsV2(params, function(err, data) {
        if (err) {
            console.log(err.message)
            return 'There was an error viewing your album: ' + err.message
        } else{
            //console.log(data)
            var schedules = []
            for (var i = 0; i < data.CommonPrefixes.length; i++){
                schedules.push(data.CommonPrefixes[i].Prefix.split('/')[2])
            }
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
        Bucket: 'maventest1',
        Prefix: group + '/', 
        Delimiter: '/'
    }
    s3.listObjectsV2(params, function(err, data) {
        if (err) {
            console.log(err.message)
            return 'There was an error viewing your album: ' + err.message
        } else{
            promises = []
            for (var i = 0; i < data.CommonPrefixes.length; i++){
                var name = data.CommonPrefixes[i].Prefix.split('/')[1]
                if ((name != 'media') && (name != 'schedules')){
                    var configParams = {
                        Bucket: 'maventest1',
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
                        var playlistConfig = JSON.parse(data)

                    }
                    callback(config, req, res)
                })
        }
    })
}

const getPlaylistsandURL = (group, req, res, callback) => {
    const params = {
        Bucket: 'maventest1',
        Prefix: group + '/', 
        Delimiter: '/'
    }
    s3.listObjectsV2(params, function(err, data) {
        if (err) {
            console.log(err.message)
            return 'There was an error viewing your album: ' + err.message
        } else{
            promises = []
            for (var i = 0; i < data.CommonPrefixes.length; i++){
                var name = data.CommonPrefixes[i].Prefix.split('/')[1]
                if ((name != 'media') && (name != 'schedules')){
                    var configParams = {
                        Bucket: 'maventest1',
                        Key: group + '/' + name + '/' + name + '_config.json', 
                    }
                    promises.push(getObject(configParams))
                }
            }
            var config = []
            Promise.all(promises)
                .then(function(results){
                    var uniqueMedia = []
                    var uniquePlaylist = {}
                    for (var i in results){
                        var data = JSON.parse(results[i].Body.toString())
                        config.push(data)
                        var playlistMedia = data.playlist
                        for (var j in playlistMedia){
                            uniqueMedia.push(playlistMedia[j][0])
                            uniquePlaylist[playlistMedia[j][0]] = data.playlistName
                        }
                    }
                    uniqueMedia = Array.from(new Set(uniqueMedia))
                    urls = '{'
                    for (var i in uniqueMedia){
                        var fileParams = {
                            Bucket: 'maventest1',
                            Key: group + '/' + uniquePlaylist[uniqueMedia[i]] + '/' + uniqueMedia[i],
                            ResponseContentType: mime.lookup(uniqueMedia[i])
                        }
                        //urls[uniqueMedia[i]] = s3.getSignedUrl('getObject', fileParams)
                        urls += '"' + uniqueMedia[i] + '":"' + s3.getSignedUrl('getObject', fileParams) + '",'
                    }
                    urls = urls.slice(0, -1) + '}'
                    callback(config, urls, req, res)
                })
        }
    })
}

const getSchedulesandURL = (group, req, res, callback) => {
    const params = {
        Bucket: 'maventest1',
        Prefix: group + '/schedules/', 
        Delimiter: '/'
    };
    s3.listObjectsV2(params, function(err, data) {
        if (err) {
            console.log(err.message)
            return 'There was an error viewing your album: ' + err.message
        } else{
            var schedules = []
            var promises = []
            for (var i = 0; i < data.CommonPrefixes.length; i++){
                var schedule = data.CommonPrefixes[i].Prefix.split('/')[2]
                var configParams = {
                    Bucket: 'maventest1',
                    Key: group + '/schedules/' + schedule + '/' + schedule + '_schedule.json', 
                }
                promises.push(getObject(configParams))
            }

            Promise.all(promises)
                .then(function(results){
                    var uniqueMedia = []
                    var uniqueSchedule = {}
                    var schedules = []
                    for (var i in results){
                        var data = JSON.parse(results[i].Body.toString())
                        schedules.push(data)
                        console.log(data)
                        for (var j in Object.keys(data['mediaNames'])){
                            uniqueMedia.push(Object.keys(data['mediaNames'])[j])
                            uniqueSchedule[Object.keys(data['mediaNames'])[j]] = [data['scheduleName'], data['mediaNames'][Object.keys(data['mediaNames'])[j]]]
                        }
                    }
                    uniqueMedia = Array.from(new Set(uniqueMedia))
                    urls = '{'
                    for (var i in uniqueMedia){
                        var fileParams = {
                            Bucket: 'maventest1',
                            Key: group + '/schedules/' + uniqueSchedule[uniqueMedia[i]][0] + '/' + uniqueSchedule[uniqueMedia[i]][1] + '/' + uniqueMedia[i],
                            ResponseContentType: mime.lookup(uniqueMedia[i])
                        }
                        urls += '"' + uniqueMedia[i] + '":"' + s3.getSignedUrl('getObject', fileParams) + '",'
                    }
                    urls = urls.slice(0, -1) + '}'
                    callback(schedules, urls, req, res)
                })
        }
    })
}

const deletePlaylist = (playlist, group) => {
    const params = {
        Bucket: 'maventest1',
        Prefix: group + '/' + playlist + '/', 
        Delimiter: '/'
    };
    s3.listObjects(params, function(err, data) {
        if (err) {
            return 'There was an error viewing your album: ' + err.message
        }else{
            const delParams = {
                Bucket: 'maventest1',
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
        Bucket: 'maventest1',
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
                    Bucket: 'maventest1',
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
        Bucket: 'maventest1',
        Key: group + '/media/' + filename
        // Delete: {Objects: [{}]},  
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
    getFilesandURL: getFilesandURL,
    getPlaylistsandURL: getPlaylistsandURL,
    getSchedulesandURL: getSchedulesandURL,
}