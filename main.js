// Import 
if (process.env.NODE_ENV !== 'production') {
    const dotenv = require('dotenv').config()
}
const { express, passport, flash, session, methodOverride, expressLayouts } = require('./scripts/dependancies/modules.js')
const { users } = require('./scripts/account/data')
const initializePassport = require('./scripts/account/passport-config')
const app = express()

// Port
const port = 9376


// For ajax POST parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

// Account & Sessions
initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
)
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))


// View Engine
app.use(expressLayouts)
app.set('layout', 'layout')
app.set('view engine', 'ejs')
app.listen(port)

// Routes
var homeRoute = require('./scripts/routes/home')
var loginRoute = require('./scripts/routes/login')
var filesRoute = require('./scripts/routes/files')
var mqttRoute = require('./scripts/routes/mqtt')
var uploadRoute = require('./scripts/routes/upload')
var devicesRoute = require('./scripts/routes/devices')
var mediaRoute = require('./scripts/routes/media')
var playlistRoute = require('./scripts/routes/viewPlaylist')
var scheduleRoute = require('./scripts/routes/listSchedules')
var viewScheduleRoute = require('./scripts/routes/viewSchedule')
const { checkAuthenticated } = require('./scripts/account/permissions.js')

app.use('/', homeRoute)
app.use('/login', loginRoute)
app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
})

app.use('/files', filesRoute)
app.use('/mqtt', mqttRoute)
app.use('/upload', uploadRoute)
app.use('/devices', devicesRoute)
app.use('/media', mediaRoute)
app.use('/viewPlaylist', playlistRoute)
app.use('/listSchedules', scheduleRoute)
app.use('/viewSchedule', viewScheduleRoute)
app.use(express.static('public'));

// Routes non-existant routes to home
app.use((req, res) => {
    res.redirect("/login")
})

console.log('Server listening at port ' + port)