document.getElementById('register-button').addEventListener('click',function(){
    fetch('/register', {
        body: new FormData(document.getElementById('register-form')),
        method:'post'
    }).then(response=>{
        return response.json()
    }).then(response=>{
        console.log(response)
            document.getElementById('status').innerHTML = response.status
            if(response.isregistered = 'true'){
                setTimeout(function(){
                    window.location.href = '/login'
                }, 2000)
            }
    })
})
