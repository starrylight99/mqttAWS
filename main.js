const { express, bodyParser } = require('./scripts/dependancies/modules.js')

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.set('view engine', 'ejs')
app.listen(port)


var homeRoute = require('./scripts/routes/home')
var filesRoute = require('./scripts/routes/files')
var mqttRoute = require('./scripts/routes/mqtt')

app.use('/', homeRoute)
app.use('/files', filesRoute)
app.use('/mqtt', mqttRoute)

app.use('/upload',(req, res, next) => {
    res.render('upload')
})
app.use((req, res, next) => {
    res.redirect("/")
})

console.log('Server listening at port ' + port)