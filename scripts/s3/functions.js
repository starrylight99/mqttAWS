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
                    console.log(data)
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
    console.log(file)
    for (let j = 0; j < 2; j++){
        if (file.playlists[j] != undefined){
            for (let i = 0; i < file.playlists[j].length; i++){
                playlistSet.push(file.playlists[j][i][0])
            }
        }
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

const getSchedules = (group, req, res, piState, pi, devices, callback) => {
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
            if (devices){
                callback(schedules, req, res, piState, pi)
            }else{
                callback(schedules, req, res)
            }
            
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

const getSchedulesandURL = (sched, group, req, res, callback) => {
    var promises = []
    var configParams = {
        Bucket: 'maventest1',
        Key: group + '/schedules/' + sched + '/' + sched + '_schedule.json', 
    }
    promises.push(getObject(configParams))
    Promise.all(promises)
        .then(function(results){
            var uniqueMedia = []
            var uniqueSchedule = {}
            var schedule = JSON.parse(results[0].Body.toString())
            for (var j in Object.keys(schedule['mediaNames'])){
                uniqueMedia.push(Object.keys(schedule['mediaNames'])[j])
                uniqueSchedule[Object.keys(schedule['mediaNames'])[j]] = [schedule['scheduleName'], schedule['mediaNames'][Object.keys(schedule['mediaNames'])[j]]]
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
            callback(schedule, urls, req, res)
        })
}

const deleteFolders = (folders, group, schedule) => {
    var promises = []
    if (schedule){
        for (var i = 0; i < folders.length; i++){
            var params = {
                Bucket: 'maventest1',
                Prefix: group + '/schedules/' + folders[i] + '/', 
                Delimiter: '/'
            }
            promises.push(listObject(params))
        }
    }else{
        for (var i = 0; i < folders.length; i++){
            var params = {
                Bucket: 'maventest1',
                Prefix: group + '/' + folders[i] + '/', 
                Delimiter: '/'
            }
            promises.push(listObject(params))
        }
    }
    Promise.all(promises)
        .then(function(results){
            promises = []
            const delParams = {
                Bucket: 'maventest1',
                Delete: {Objects: []}, 
            };
            for (var i in results){
                results[i].Contents.forEach(function(obj){
                    delParams.Delete.Objects.push({Key: obj.Key})
                    console.log(obj.Key,"<<<file path")
                })
                console.log(results[i])
                for (var j in results[i].CommonPrefixes){
                    console.log(results[i].CommonPrefixes[j].Prefix)
                    var subParams = {
                        Bucket: 'maventest1',
                        Prefix: results[i].CommonPrefixes[j].Prefix, 
                        Delimiter: '/'
                    }
                    promises.push(listObject(subParams))
                }
            }
            if (promises.length > 0){
                Promise.all(promises)
                    .then(function(results){
                        for (var i in results){
                            results[i].Contents.forEach(function(obj){
                                delParams.Delete.Objects.push({Key: obj.Key})
                                console.log(obj.Key,"<<<file path")
                            })
                        }
                        s3.deleteObjects(delParams, function(err, data) {
                            if (err) console.log(err, err.stack);
                            else console.log('delete', data);
                        })
                    })
            }else{
                s3.deleteObjects(delParams, function(err, data) {
                    if (err) console.log(err, err.stack);
                    else console.log('delete', data);
                })
            }
        })
    // s3.listObjects(params, function(err, data) {
    //     if (err) {
    //         return 'There was an error viewing your album: ' + err.message
    //     }else{
    //         const delParams = {
    //             Bucket: 'maventest1',
    //             Delete: {Objects: []}, 
    //         };
    //         console.log(data.Contents,"<<<all content");
    //         data.Contents.forEach(function(obj,index){
    //             console.log(obj.Key,"<<<file path")
    //             delParams.Delete.Objects.push({Key: obj.Key})
    //         })
    //         s3.deleteObjects(delParams, function(err, data) {
    //             if (err) console.log(err, err.stack);
    //             else console.log('delete', data);
    //         })
    //     }
    // })
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

const deleteFiles = (delFiles, group) => {
    const delParams = {
        Bucket: 'maventest1',
        Delete: {Objects: []}, 
    };
    for (var i = 0; i < delFiles.length; i++){
        delParams.Delete.Objects.push({Key: group + '/media/' + delFiles[i]})
    }

    s3.deleteObjects(delParams, function(err, data) {
        if (err) console.log(err, err.stack);
        else console.log('delete', data);
    })
}

module.exports = {
    uploadFile: uploadFile,
    getPlaylist: getPlaylist,
    deleteFiles: deleteFiles,
    getFiles: getFiles,
    uploadConfig: uploadConfig,
    deleteFolders: deleteFolders,
    getPlaylists: getPlaylists,
    uploadSchedule: uploadSchedule,
    getSchedules: getSchedules,
    getFilesandURL: getFilesandURL,
    getPlaylistsandURL: getPlaylistsandURL,
    getSchedulesandURL: getSchedulesandURL,
}