var http = require("http");

var options = {  
    host : "localhost",
    port: process.env.STIGMAN_API_PORT || 54000,
    path: "/api/op/configuration",
    timeout : 2000
};

var request = http.request(options, (res) => {  
    console.log(`STATUS: ${res.statusCode}`);
    if (res.statusCode == 200) {
        process.exit(0);
    }
    else {
        process.exit(1);
    }
});

request.on('error', function(err) {  
    console.log('ERROR');
    process.exit(1);
});

request.end();  
