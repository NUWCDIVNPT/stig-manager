const http = require("http")

const options = {  
    host : "localhost",
    port: process.env.STIGMAN_API_PORT || 54000,
    path: "/api/op/definition?jsonpath=%24.info.version",
    timeout : 2000
}

const request = http.request(options, (res) => {  
    console.log(`STATUS: ${res.statusCode}`)
    if (res.statusCode == 200) {
        process.exit(0)
    }
    else {
        process.exit(1)
    }
})

request.on('error', function(err) {  
    console.log('ERROR')
    process.exit(1)
})

request.end()
