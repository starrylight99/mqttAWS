var express = require('express')
var mqtt = require('mqtt')
var ejs = require('ejs')
var bodyParser = require('body-parser')
const multer = require('multer')

var AWS = require('aws-sdk')
var fs = require('fs')

const config = require('./config.json')
const { get } = require('https')

const upload = multer({ dest: "uploads/" })

const s3Config = {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region,
   }
var s3 = new AWS.S3(s3Config);

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

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.set('view engine', 'ejs')
app.listen(port)
console.log('Server listening at port ' + port)

const address = 'mqtts://18.141.182.21'
const user = {
    username: 'maventest',
    password: '12345',
    protocol: 'mqtts',
    ca: 'Downloads/ca.crt',
    protocolVersion: 4,
    keepalive: 60,
    reconnectPeriod: 1000,
    clean: true,
    encoding: 'utf8',
    rejectUnauthorized: false
}

var client = mqtt.connect(address, user)
var temperature = undefined

app.route('/')
    .get((req, res) => {
        res.render('main')
})

app.route('/temperature')
    .post(async(req, res) => {
        console.log(req.body)

        client.subscribe('temperature', (err)=> {
            if (!err) {
                client.publish('temperature', req.body.text)
                console.log('sent msg "' + req.body.text + '"')
            } else {
                console.log('failed subscribe')
                res.send('error')
            }
        })
        await new Promise(resolve => setTimeout(resolve, 500))
        res.send(temperature)
        temperature = undefined
})


app.post('/upload', upload.array('files', 12), (req, res, next) => {
    const files = req.files
    if (!files) {
        const error = new Error('Please choose files')
        error.httpStatusCode = 400
        return next(error)
    }  
    console.log(files)
    for (let i = 0; i < files.length; i++){
        uploadFile(files[i])
    }
    res.render('main')
})

app.get('/retrieve', (req, res, next) => {
    var filename = req.url.split('=')[1]
    getFile(filename)
    res.render('main')
})

client.on('connect', function () {
    console.log('connected')
})

client.on('message', function (topic, message) {
    console.log('Message: ' + message.toString())
    if (message.toString().slice(1,5) == 'temp') {
        temperature = message.toString()
    }
    //client.end()
})