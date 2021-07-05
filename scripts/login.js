document.getElementById('login-button').addEventListener('click',function(){
    fetch('/login', {
        
        body: new FormData(document.getElementById('login-form')),
        method:'post'
    }).then(response=>{
        return response.json()
    }).then(response=>{
        console.log(response)
        document.getElementById('status').innerHTML = response.status
        if(response.isloggedin == 'true'){
            window.location.href = '/home'
        }
    })
})

// Notification.requestPermission().then(function(){
//     var notification = new Notification("hello", )
// })