const socket = io('/')

const myvideo = document.getElementById("my-video")
const vidlist = document.getElementById("list-of-videos")
const joincallbutton = document.getElementById("joincall-button")
const screensharebutton = document.getElementById("screenshare-button")
var clientsincall = {}
var clientsinroom = {}
var incall = false;
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
            notify("you", "joined the call")
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
                const videoelement = adduservid(call.metadata.name, call.peer)
                call.on('stream', function(theirstream){
                    assignuservid(videoelement, theirstream)
                })
            })
        }
        else{
            notify("you", "left the call")
            joincallbutton.innerHTML="Join call"
            joincallbutton.style.backgroundColor="#216383"
            incall = false
            socket.emit('leaverequest-call', {room : room, id : peer.id, name: myname, username : myusername})
            socket.removeAllListeners('clientjoined-call');
            peer.removeAllListeners('call')
            for(let id in clientsincall){
                document.getElementById(id).remove()
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


screensharebutton.addEventListener('click', function(){
    navigator.mediaDevices.getDisplayMedia().then(function(myscreenstream){
        for(let id in clientsincall){
            //console.log("sharing screen with " + clientsincall[id])
            peer.call(id, myscreenstream, {metadata: {name:myname, type:'screen'}}) 
        }
        socket.on('clientjoined-call', function(clientdata){
            //console.log("sharing screen with " + clientdata.name)
            setTimeout(() => {
                peer.call(clientdata.id, myscreenstream, {metadata: {name:myname, type:'screen'}})
            }, 500)
        })
    })
})


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

