const { config } = require('aws-sdk');
const { fs, mime } = require('../dependancies/modules')
var { s3 } = require('./config')

/**
 * Promise Wrapper to list objects upon success 
 * @param {Object} params - parameters to list objects in S3 (Bucket, Prefix, Delimiter)
 * @returns {Object} returns promise wrapper of the listObjectsV2 function
 */
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
/**
 * ASYNC Uploads schedule config to S3 and copy all relevant playlist folder to specific s3 schedule folder
 * Structure will be {group}/schedules/{scheduleName}/{playlist folders + {scheduleName}_schedule.json}
 * @param {Object} schedule - JSON object containing: scheduleName (string), schedule (JSON containing startTime (str), endTime (str), playlists (array of str), days (array of str)),
 *                                                    uniquePlaylist (array of Set of all playlists in schedule), totalScreens (string), orientation (string: portrait/landscape)
 * @param {string} group - name of the group user belongs to
 */
const uploadSchedule = (schedule, group) => {
    console.log(schedule.scheduleName)
    // Get all promises of listing objects in each playlist into array 
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
            // mediaNames {object} dictionary of mediaNames : a playlistName that has that media --to be used to generate signed URLs
            // playlistMedia {object} dictionary of playlistNames : all its media --to be used for displaying playlist media in schedule
            var mediaNames = {}
            var playlistMedia = {}
            for (var i in results){ //iterate through all playlists
                playlistMedia[schedule.uniquePlaylist[i]] = []
                console.log(playlistMedia)
                results[i].Contents.forEach(function(obj){ //iterating through a specific playlist
                    var filepath = obj.Key
                    const fileParams = {
                        Bucket: 'maventest1',
                        CopySource: 'maventest1/' + filepath,
                        Key: group + '/schedules/'+ schedule.scheduleName + '/' + schedule.uniquePlaylist[i] + '/' + filepath.split('/').slice(-1)[0],
                    }

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

            // Uploading scheduleconfig to bucket
            s3.upload(params, function(err, data) {
                if (err) {
                    throw err;
                }
                console.log(`File uploaded successfully. ${data.Location}`);
            });
        })
};

/**
 * ASYNC uploads playlist config and copies all media from media folder to the playlist folder
 * Playlist folder structure is {group}/{playlistName}/{all relevant media files + {playlistName}_config.json}
 * @param {Object} file - JSON object consisting: playlistName (string), aspect_ratio (array of 2 strings, [length, width]), 
 *                                                playlists (array of array of media files played in order, images have additional element for duration to be played),
 *                                                screens (string of number of screens), orientation (string, portrait or landscape), splitScreen (string of boolean if screen is split or not (portrait-split))
 * @param {string} playlistName  - string of playlistName
 * @param {string} group - c
 */
const uploadConfig = (file, playlistName, group) => {
    // playlistSet - unique Array of media in playlist, then copy all files to the playlist folder
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
    // upload config file to s3 in the playlist folder
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

/**
 * ASYNC upload single media to s3. Destination is {group}/media/{filename}
 * @param {Array} files - array of file object as defined in multer
 * @param {string} group - name of the group user belongs to
 */
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

/**
 * SYNC List all media files in the media folder --used to create playlist 
 * After getting list of all media files, execute callback function
 * @param {string} group - name of the group user belongs to
 * @param {Object} req - request object 
 * @param {Object} res - response object
 * @param {Function} callback - callback function to execute after getting list of all files in media folder of S3
 */
const listFiles = (group, req, res, callback) => {
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
                filenames.push(obj.Key.split('/').slice(-1)[0])
            })
            callback(filenames, req, res)
        }
    })
}

/**
 * SYNC List all media files in the media folder and get the preSigned URL of each media --used to preview media
 * preSigned URL are secure and have default expiration time of 60 minutes 
 * After getting list of all media files and URLs, execute callback function
 * @param {string} group - name of the group user belongs to
 * @param {Object} req - request object 
 * @param {Object} res - response object
 * @param {Function} callback - callback function to execute after getting list of all files and URLs in media folder of S3
 */
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

/**
 * SYNC List all schedule names in S3 and execute callback function.
 * @param {string} group - name of the group user belongs to
 * @param {Object} req - request object
 * @param {Object} res - response object
 * @param {Map} piState - hash map of the states of each PI/NUC, null if devices == false
 * @param {Array} pi - array of pi JSON object containing: id (integer), name of Pi(string), group Pi belongs to (string), location it is at (string), null if devices == false
 * @param {boolean} devices - true if callback function involves devices such as Pi, false otherwise
 * @param {Function} callback - callback function to be executed after listing all the schedule names
 */
const listSchedules = (group, req, res, piState, pi, devices, callback) => {
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

/**
 * Promise Wrapper to get objects upon success 
 * @param {Object} params - parameters to get object in S3 (Bucket, Key)
 * @returns {Object} returns promise wrapper of the getObject function
 */
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

/**
 * SYNC Get the config json of all playlists available and execute callback function
 * @param {string} group - name of the group user belongs to
 * @param {Object} req - request object
 * @param {Object} res - response object
 * @param {Function} callback - callback function to execute after getting config json of all playlists available in S3
 */
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
                var name = data.CommonPrefixes[i].Prefix.split('/')[1] // getting name of playlist
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
                    }
                    callback(config, req, res)
                })
        }
    })
}

/**
 * SYNC Get config JSON of all playlists and URLs of all unique media in all playlists. Then, execute callback function
 * @param {string} group - c
 * @param {Object} req - request object
 * @param {Object} res - response object
 * @param {Function} callback - callback function to execute after getting config json of all playlists available in S3 and the URLs for all of its unique media
 */
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
            // Set up array of promises to get the config JSON of all playlists
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
                    // Extract the unique media and get any corresponding playlist which that media is in
                    var uniqueMedia = []
                    var uniquePlaylist = {}
                    for (var i in results){
                        var data = JSON.parse(results[i].Body.toString())
                        config.push(data)
                        var playlistMedia = data.playlists
                        for (var j in playlistMedia){
                            playlistMedia[j].forEach((playlist)=>{
                                console.log(playlist)
                                uniqueMedia.push(playlist[0])
                                uniquePlaylist[playlist[0]] = data.playlistName
                            })     
                        }
                    }
                    uniqueMedia = Array.from(new Set(uniqueMedia))
                    // urls is a string that can be parsed into JSON 
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

/**
 * SYNC Get the config JSON of given schedule and the URLs of all unique media in that schedule. Excute callback function after that
 * @param {string} sched - string of scheduleName
 * @param {string} group - name of group the user belongs to
 * @param {Object} req - request object
 * @param {Object} res - response object
 * @param {Function} callback - callback function to execute after getting config json of schedule given and all of its unique media URL
 */
const getScheduleandURL = (sched, group, req, res, callback) => {
    var promises = []
    var configParams = {
        Bucket: 'maventest1',
        Key: group + '/schedules/' + sched + '/' + sched + '_schedule.json', 
    }
    promises.push(getObject(configParams))
    Promise.all(promises)
        .then(function(results){
            // uniqueMedia is array of Set of all media names
            // uniqueSchedule is dictionary mapping mediaNames to its scheduleName and Playlist Name
            var uniqueMedia = []
            var uniqueSchedule = {}
            var schedule = JSON.parse(results[0].Body.toString())
            for (var j in Object.keys(schedule['mediaNames'])){
                uniqueMedia.push(Object.keys(schedule['mediaNames'])[j])
                uniqueSchedule[Object.keys(schedule['mediaNames'])[j]] = [schedule['scheduleName'], schedule['mediaNames'][Object.keys(schedule['mediaNames'])[j]]]
            }
            uniqueMedia = Array.from(new Set(uniqueMedia))
            // urls is a string that can be parsed into JSON
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

/**
 * SYNC Delete Folders (playlists/schedules) in S3
 * @param {Array} folders - array of string of the folders' names
 * @param {string} group  - name of group the user belongs to
 * @param {boolean} schedule - true if deleting schedules, false if deleting playlists
 */
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
                // Recursively delete subdirectories, more applicable to deleting schedules
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
                // If no subdirectories, then delete
                s3.deleteObjects(delParams, function(err, data) {
                    if (err) console.log(err, err.stack);
                    else console.log('delete', data);
                })
            }
        })
}

/**
 * Delete media files in S3
 * @param {Array} delFiles - Array of all media files to be deleted in S3
 * @param {string} group - name of group user belongs to
 */
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
    deleteFiles: deleteFiles,
    listFiles: listFiles,
    uploadConfig: uploadConfig,
    deleteFolders: deleteFolders,
    getPlaylists: getPlaylists,
    uploadSchedule: uploadSchedule,
    listSchedules: listSchedules,
    getFilesandURL: getFilesandURL,
    getPlaylistsandURL: getPlaylistsandURL,
    getScheduleandURL: getScheduleandURL,
}