const socket = io('/')

const myvideo = document.getElementById("my-video")
const vidlist = document.getElementById("list-of-videos")
const joincallbutton = document.getElementById("joincall-button")
const screensharebutton = document.getElementById("screenshare-button")
var clientsincall = {}
var clientsinroom = {}
var incall = false
var sharingscreen = false
var peer = new Peer(undefined,{
    secure: true
})

peer.on('open', function(id){
    socket.emit('joinrequest', {room : room, id : id, name: myname, username : myusername})
})


navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(function(mystream) {
    myvideo.srcObject = mystream
    myvideo.play()
    joincallbutton.onclick = function(){
        if(incall == false){
            notify("You", "joined the call")
            joincallbutton.innerHTML="Leave call"
            joincallbutton.style.backgroundColor="rgb(255, 79, 79)"
            incall = true
            socket.emit("joinrequest-call")
            socket.on('clientjoined-call', function (clientdata){//making call
                console.log(clientdata.name + ' has joined')
                clientsincall[clientdata.id] = clientdata.name
                var call = peer.call(clientdata.id, mystream, {metadata: {name:myname, type:'camera'}})
                //console.log("call made to "+ newclientdata.id)
                const videoelement = adduservid(clientdata.name, clientdata.id) //this element may be removed when desired by videoelement.remove()
                call.on('stream', function(theirstream){
                    //console.log("getting stream")
                    assignuservid(videoelement, theirstream)           
                })
            })
            
            peer.on('call', function (call){//recieving call
                console.log("being called by " + call.metadata.name)
                clientsincall[call.peer] = call.metadata.name
                call.answer(mystream)
                var videoelement = null
                if(call.metadata.type == 'camera'){
                    videoelement = adduservid(call.metadata.name, call.peer)
                }else{
                    videoelement = adduservid(call.metadata.name+'\'s screen', call.peer+'screen')
                }
                call.on('stream', function(theirstream){
                    assignuservid(videoelement, theirstream)
                })
            })
        }
        else{
            notify("You", "left the call")
            joincallbutton.innerHTML="Join call"
            joincallbutton.style.backgroundColor="#216383"
            incall = false
            socket.emit('leaverequest-call', {room : room, id : peer.id, name: myname, username : myusername})
            socket.removeAllListeners('clientjoined-call')
            if(sharingscreen){
                stopscreenshare()
            }
            peer.removeAllListeners('call')
            for(let id in clientsincall){
                document.getElementById(id).remove()
                if(document.getElementById(id+'screen')!=null){
                    document.getElementById(id+'screen').remove()
                }
                peer.connections[id].forEach(connection => {
                    connection.peerConnection.close()
                });
                peer.connections[id].forEach(connection => {
                    connection.close()
                });
            }
        }
    }
    
})

socket.on('clientjoined', function(clientdata){
    clientsinroom[clientdata.username] = clientdata.name
})

socket.on('clientleft', function(clientdata){
    //console.log(clientdata.name + " disconnected")
    if(clientdata.id in clientsincall && incall){
        delete clientsincall[clientdata.id]
        peer.connections[clientdata.id].forEach(connection => {
            connection.peerConnection.close()
        });
        peer.connections[clientdata.id].forEach(connection => {
            connection.close()
        });
        document.getElementById(clientdata.id).remove()
        document.getElementById(clientdata.id+'screen').remove()
    }
    delete clientsinroom[clientdata.username]
})

socket.on('clientleft-call', function(clientdata){
    delete clientsincall[clientdata.id]
    peer.connections[clientdata.id].forEach(connection => {
        connection.peerConnection.close()
    });
    peer.connections[clientdata.id].forEach(connection => {
        connection.close()
    });
    document.getElementById(clientdata.id).remove()
})

socket.on("clientleft-screenshare", function(clientdata){
    if(peer.connections[clientdata.id][1]!=null){
        peer.connections[clientdata.id][1].peerConnection.close()
        peer.connections[clientdata.id][1].close()
    }
    else{
        peer.connections[clientdata.id][0].peerConnection.close()
        peer.connections[clientdata.id][0].close()
    }
    document.getElementById(clientdata.id+'screen').remove()
})


screensharebutton.onclick = function(){
    if(!sharingscreen && incall){
        screenshare()
    }
    else if(!sharingscreen && !incall){
        alert("Please join the call to share screen")
    }
    else if(sharingscreen && incall){
        stopscreenshare()
    }
    else if(sharingscreen && !incall){

    }
}

function screenshare(){
    sharingscreen=true
    screensharebutton.innerHTML = "Stop sharing"
    screensharebutton.style.backgroundColor="rgb(255, 79, 79)"
    navigator.mediaDevices.getDisplayMedia().then(function(myscreenstream){
        for(let id in clientsincall){
            //console.log("sharing screen with " + clientsincall[id])
            const call = peer.call(id, myscreenstream, {metadata: {name:myname, type:'screen'}}) 
            screensharebutton.addEventListener('click', function(){
                call.close()
            }, {once: true})
        }
        socket.on('clientjoined-call', function(clientdata){
            //console.log("sharing screen with " + clientdata.name)
            const call = peer.call(clientdata.id, myscreenstream, {metadata: {name:myname, type:'screen'}})
            screensharebutton.addEventListener('click', function(){
                call.close()
            }, {once: true})
        })
        screensharebutton.addEventListener('click', function(){
            const tracks = myscreenstream.getTracks()
            tracks.forEach(track=> track.stop())
        }, {once: true})

    })
}

function stopscreenshare(){
    sharingscreen=false
    screensharebutton.innerHTML = "Share screen"
    screensharebutton.style.backgroundColor="#216383"
    socket.emit("endingscreenshare", {room : room, id : peer.id, name: myname, username : myusername})
    // for(let id in clientsincall){
    //     peer.connections[id][1].peerConnection.close()
    //     peer.connections[id][1].close()
    // }
}


function assignuservid(element, stream){
    element.srcObject = stream
    element.play()
}

function adduservid(name, id){ 
    const newlistelement = document.createElement("li")
    newlistelement.className = "video-container"
    newlistelement.id = id
    const newnamediv = document.createElement('div')
    newnamediv.innerHTML = name
    const newvideo = document.createElement("video")
    newlistelement.append(newvideo)
    newlistelement.append(newnamediv)
    vidlist.append(newlistelement)
    return newvideo
}

function stopcapturingscreen(stream){
    const tracks = stream.getTracks()
    tracks[0].stop()
    screensharebutton.removeEventListener('click', this)
}