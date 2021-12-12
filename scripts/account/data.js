const JsonDB = require('node-json-db').JsonDB;
const Config = require('node-json-db/dist/lib/JsonDBConfig').Config;
const { bcrypt } = require('../dependancies/modules')

//var piDb = new JsonDB(new Config("pi", true, false, '/'))
var userDb = new JsonDB(new Config("user", true, false, '/'))

//var piData = piDb.getData('/'); 
var userData = userDb.getData('/'); var users = []

for (var user in userData) {
    users.push(userData[user])
}

//var hashedPassword = bcrypt.hash('12345', 10)
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
] */

/* users.forEach(element => {
    userDb.push('/'+element.id,element,false)
}); */

module.exports = {
    users: users
}