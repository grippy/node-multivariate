var util = require('util'),
	http = require('http'), 
    net = require('net'),
    app = require('../app');   
var config = require('./config').init()
var socket_handler = http.Server(app.handler)
socket_handler.port = config.app_port; // set this so the app server knows what port the request originated from.
var c = net.createConnection('/tmp/node_multivariate_server.sock');
c.setEncoding('utf8')

c.on('fd', function (fd) { 
    util.puts('=> Server listening on socket' + ' (pid:' + process.pid +')')
    socket_handler.listenFD(fd); 
});
c.on('error', function(e){
    util.puts(util.inspect(e))
})