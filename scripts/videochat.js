const socket = io('/')

const myvideo = document.getElementById("my-video")
const vidlist = document.getElementById("list-of-videos")
const endcallbutton = document.getElementById("endcall-button")
const startcallbutton = document.getElementById("startcall-button")
const screensharebutton = document.getElementById("screenshare-button")

// var myname = prompt("What's your name?")
//var myname = 'Jayesh'
var connected_clients = {}

var tisme = new Peer(undefined,{
    host: '/',
    port: '3000',
    secure: true
})

tisme.on('open', function(id){
    socket.emit('joinrequest', {room : room, id : id, name: myname})
})


navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(function(mystream) {
    myvideo.srcObject = mystream
    myvideo.play()

    tisme.on('call', function(call){
        console.log("being called by " + call.metadata.name)
        connected_clients[call.peer] = call.metadata.name
        call.answer(mystream)
        const videoelement = adduservid(call.metadata.name, call.peer)
        call.on('stream', function(theirstream){
            assignuservid(videoelement, theirstream)
        })
        endcallbutton.addEventListener('click',function(){
            call.close()
        })
    })
    
    socket.on('clientjoined', function(clientdata){
        console.log(clientdata.name + ' has joined')
        connected_clients[clientdata.id] = clientdata.name
        setTimeout(() => {
            var call = tisme.call(clientdata.id, mystream, {metadata: {name:myname, type:'camera'}})
            //console.log("call made to "+ newclientdata.id)
            const videoelement = adduservid(clientdata.name, clientdata.id) //this element may be removed when desired by videoelement.remove()
            call.on('stream', function(theirstream){
                //console.log("getting stream")
                assignuservid(videoelement, theirstream)           
            })
            call.on('close', function(){
                console.log("call closed")
            })
        }, 400)
    })

    socket.on('clientdisconnected', function(clientdata){
        //console.log(clientdata.name + " disconnected")
        delete connected_clients[clientdata.id]
        document.getElementById(clientdata.id).remove()
    })
})


screensharebutton.addEventListener('click', function(){
    navigator.mediaDevices.getDisplayMedia().then(function(myscreenstream){
        for(let id in connected_clients){
            //console.log("sharing screen with " + connected_clients[id])
            tisme.call(id, myscreenstream, {metadata: {name:myname, type:'screen'}}) 
        }
        socket.on('clientjoined', function(clientdata){
            //console.log("sharing screen with " + clientdata.name)
            setTimeout(() => {
                tisme.call(clientdata.id, myscreenstream, {metadata: {name:myname, type:'screen'}})
            }, 500)
        })
    })
})



function assignuservid(element, stream){ //this function merely assigns the stream to the video element passed to it
    //console.log("assign func called")
    element.srcObject = stream
    element.play()
}

function adduservid(name, id){ //this function creates a video element and writes the name beneath it
    //console.log("vid elem adding")
    const newlistelement = document.createElement("li")
    newlistelement.id = id
    const newnamediv = document.createElement('div')
    newnamediv.innerHTML = name
    const newvideo = document.createElement("video")
    newlistelement.append(newvideo)
    newlistelement.append(newnamediv)
    newlistelement.className = "video-container"
    vidlist.append(newlistelement)
    return newvideo
}

