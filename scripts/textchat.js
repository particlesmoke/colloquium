const chatinput = document.getElementById('chat-input')
const chatscontainer = document.getElementById('chats-container')
const openchatbutton = document.getElementById("openchat-button")
document.getElementById('chat-form').addEventListener('submit', function(e){
    e.preventDefault()
    sendmessage(chatinput.value)
    chatinput.value = ''
})


socket.on("clientjoined", function(clientdata){
    notify(clientdata.name, 'joined the room')
})

socket.on("clientleft", function(clientdata){
    notify(clientdata.name, 'left the room')
})

socket.on("clientjoined-call", function(clientdata){
    notify(clientdata.name, 'joined the call')
})

socket.on("clientleft-call", function(clientdata){
    notify(clientdata.name, 'left the call')
})

socket.on('text-s2c', function(text){
    addtheirtext(text.text,text.name)
})

let lastsender = ''
var lastchat = document.createElement('div')
var ischatopen = false
openchatbutton.onclick = function(){
    document.getElementById("text-chat").style.width = "100%"
    document.getElementById("video-chat").style.width = "0%"
}

function addmytext(text){
    const chatblock = document.createElement('div')
    chatblock.className = 'chatblock'
    const newtext = document.createElement('div')
    newtext.innerHTML=text
    if(lastsender!='me'){
        addtime()
        const chat = document.createElement('div')
        chat.className = 'mychat'
        chat.append(newtext)
        chatblock.append(chat)
        chatscontainer.append(chatblock)
        lastchat = chat
        lastsender = 'me'
    }
    else{
        lastchat.append(newtext);
    }
}

function addtheirtext(text, sender){
    const chatblock = document.createElement('div')
    chatblock.className = 'chatblock'
    const newtext = document.createElement('div')
    newtext.innerHTML=text
    if(lastsender!=sender){
        addtime()
        const newsender = document.createElement('div')
        newsender.className = 'sender'
        const chat = document.createElement('div')
        chat.className = 'theirchat'
        newsender.innerHTML=sender;
        chat.append(newsender)
        chat.append(newtext)
        chatblock.append(chat)
        chatscontainer.append(chatblock)
        lastsender = sender
        lastchat = chat
    }else{
        lastchat.append(newtext)
    }
}

function sendmessage(text){
    socket.emit('text-c2s', {text: text, name: myname})
    addmytext(text)
}

function notify(name, action){
    addtime()
    let grammar = "has"
    if(name=="you"){
        grammar = "have"
    }
    const notifier = document.createElement('div')
    notifier.className = 'intext-notifier'
    notifier.innerHTML = `<b>${name}</b> ${grammar} ${action}`
    document.getElementById('chats-container').append(notifier)
}

function addtime(){
    const time = document.createElement('div')
    time.className = 'intext-time'
    const date = new Date()
    const h = date.getHours()
    const m = date.getMinutes()
    time.innerHTML = `${h}:${m}`
    document.getElementById('chats-container').append(time)
}