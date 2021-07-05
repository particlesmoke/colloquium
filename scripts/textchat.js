const chatinput = document.getElementById('chat-input')
const chatscontainer = document.getElementById('chats-container')
document.getElementById('chat-form').addEventListener('submit', function(e){
    e.preventDefault()
    sendmessage(chatinput.value)
    chatinput.value = ''
})
function sendmessage(text){
    socket.emit('text-c2s', {text: text, name: myname})
    addmytext(text)
}
socket.on('text-s2c', function(text){
    addtheirtext(text.text,text.name)

})

let lastsender = ''
var lastchat = document.createElement('div')

function addmytext(text){
    const chatblock = document.createElement('div')
    chatblock.className = 'chatblock'
    const newtext = document.createElement('div')
    newtext.innerHTML=text
    if(lastsender!='me'){
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