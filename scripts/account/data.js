const JsonDB = require('node-json-db').JsonDB;
const Config = require('node-json-db/dist/lib/JsonDBConfig').Config;
const { bcrypt } = require('../dependancies/modules')

var piDb = new JsonDB(new Config("pi", true, true, '/'))
var userDb = new JsonDB(new Config("user", true, true, '/'))

var piData = piDb.getData('/'); var pi = []
var userData = userDb.getData('/'); var users = []

for (var user in userData) {
    users.push(userData[user])
}

for (var pie in piData) {
    pi.push(piData[pie])
}

/* var users = [
    {
        id: 0,
        name: 'Super User',
        email: 'superUser@maven.org',
        password: '$2a$10$lYMl9T/B5TvwEVRIHYZ4y.mYTVCqny7i5A9vTqCsD05CSvQMJc6am',
        role: 'superuser',
        group: 'superuser',
        location: 'na'
    },
    {
        id: 1,
        name: 'Hee Kit',
        email: 'bedok@maven.org',
        password: '$2a$10$lYMl9T/B5TvwEVRIHYZ4y.mYTVCqny7i5A9vTqCsD05CSvQMJc6am',
        role: 'admin',
        group: 'maven',
        location: 'bedok'
    },
    {
        id: 2,
        name: 'Bing Heng',
        email: 'simei@maven.org',
        password: '$2a$10$lYMl9T/B5TvwEVRIHYZ4y.mYTVCqny7i5A9vTqCsD05CSvQMJc6am',
        role: 'admin',
        group: 'maven',
        location: 'simei'
    },
]

var pi = [
    {
        id: 0,
        name: 'Bedok 1',
        group: 'maven',
        location: 'bedok'
    },
    {
        id: 1,
        name: 'Simei 1',
        group: 'maven',
        location: 'simei'
    },
] */

/* pi.forEach(element => {
    piDb.push('/'+element.id,element,false)
})
users.forEach(element => {
    userDb.push('/'+element.id,element,false)
}); */

module.exports = {
    users: users,
    pi: pi,
    piDb: piDb,
    userDb: userDb
}