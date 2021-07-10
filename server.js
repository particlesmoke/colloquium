const express = require('express')
const app = express()
const fs = require('fs');
const options = {
    key: fs.readFileSync(__dirname+'\\localhost-key.pem'),
    cert: fs.readFileSync(__dirname+'\\localhost.pem')
};
const server = require('https').createServer(options, app)
const { Server } = require('socket.io')
const io = new Server(server)
const { v4: uuidv4} = require('uuid')
const multer = require('multer');
const upload = multer();
const bcrypt = require('bcrypt')
const session = require('express-session')
var users = {
    a: {
    name: 'John',
    hashedpassword: '$2b$10$u6riWXoC8adVxf1d9G0dJeJ6hvRvH.6y5mVd036fvyHZEqybXxi1K'
  },
  q: {
    name: 'Sasha',
    hashedpassword: '$2b$10$LfQBWAx9NV1.QmLdm59o/OvPNqC9CX4ez9IxpqfaePkcUU0IOr2Zm'
  }
}
var rooms = {}
// res.redirect(`/${uuidv4()}`)

app.use(session({
    secret : "olaaaaa",
    secure: false,
    saveUninitialized : false,
    resave: false,
}))
app.use(express.static('scripts'))
app.use(express.static('style'))
app.use(express.urlencoded({ extended: false }))
app.use(upload.none())
app.set('view engine', 'ejs')

app.get('/', function(req, res){
    res.redirect('/login')
})
app.get('/login', (req,res)=>{
    res.render('login')
})
app.get('/register', (req,res)=>{
    res.render('register')
})
app.get('/room', (req,res)=>{
    res.redirect(`/room/${uuidv4()}`)
})
app.get('/home', (req,res)=>{
    if(req.session.isloggedin == true){
        res.render('home',{name: users[req.session.username].name})
    }
    else{
        res.redirect('/login')
    }
})
app.post('/register', async (req,res)=>{
    console.log(req.body.username+" trying to register")
    if(req.body.name == '' || req.body.username == '' || req.body.password == ''){
        res.json({isregistered : "false", status : "All fields required"})
    }
    else if((req.body.username in users)){
        res.json({isregistered : "false", status : "Username already exists"})
    }
    else{
        const hashedpassword = await bcrypt.hash(req.body.password, 10)
        users[req.body.username] = {name:req.body.name, hashedpassword:hashedpassword}
        res.json({isregistered : "true", status : "Registered successfully, being redirected to login"})
        console.log(users)
    }   
})
app.post('/login', async (req, res)=>{
    console.log(req.body.username + " trying to login")
    if(req.body.username == '' || req.body.password == ''){
        res.json({isloggedin : "false", status : "Both fields required"})
    }
    else{
        if(!(req.body.username in users)){
            res.json({isloggedin : "false", status : "Username does not exist"})
        }
        else{
            const result = await bcrypt.compare(req.body.password, users[req.body.username].hashedpassword)
            if(!result){
                res.json({isloggedin : "false", status : "Wrong password"})
            }
            else{
                req.session.isloggedin = true
                req.session.username = req.body.username
                res.json({isloggedin: "true", status: "Logged in successfully"})
            }
        }
    }

})
app.post('/joinroom', (req,res)=>{
    res.redirect(`/room/${req.body.room}`)
})

app.get('/room/:room', function(req, res){
    if(req.session.isloggedin){
        if(rooms[req.params.rooms] == undefined){
            rooms[req.params.room]={users:[]}
            rooms[req.params.room].nos = 0
        }
        rooms[req.params.room].nos++
        rooms[req.params.room].users.push(req.session.username)
        console.log(rooms)
        res.render('app', {key : req.params.room, name:users[req.session.username].name, username:req.session.username})
    }
    else{
        res.redirect('/login')
    }
})

io.on('connection', function(socket){
    socket.on('joinrequest', function(clientdata){
        console.log(clientdata.name + " joined")
        socket.join(clientdata.room)
        socket.broadcast.to(clientdata.room).emit('clientjoined', clientdata)
        socket.on("joinrequest-call", function(){
            console.log(clientdata.name+" joining call")
            socket.broadcast.to(clientdata.room).emit('clientjoined-call', clientdata)
        })
        socket.on("leaverequest-call", function(clientdata){
            socket.broadcast.to(clientdata.room).emit('clientleft-call', clientdata)
        })
        socket.on("endingscreenshare", function(clientdata){
            socket.broadcast.to(clientdata.room).emit('clientleft-screenshare', clientdata)
        })
        socket.on('disconnect', function(reason){
            console.log(clientdata.name + " disconnected due to "+reason)
            socket.broadcast.to(clientdata.room).emit('clientleft', clientdata)
            rooms[clientdata.room].nos--
            delete rooms[clientdata.room][users][clientdata.username]
        })
        socket.on('text-c2s', function(text){
            socket.broadcast.to(clientdata.room).emit('text-s2c', text)
            console.log(text)
        })
    })
})

var port = process.env.port || 1337;

server.listen(port)