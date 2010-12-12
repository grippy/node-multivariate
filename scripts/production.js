var sys = require('sys'),
    http = require('http'),
    net = require('net'),
    fs = require('fs');
    app = require('../app');
    
var config = require('../app/config').init('production')
if (config.env != 'production'){ throw new Error('This process is only recommmeded for environment production.')}

var port = config.app_port
var slaves = (config.app_slaves != undefined) ? config.app_slaves : 0;

http_server = http.Server(app.handler)
http_server.port = port;

http_server.listen(port, function(){
    sys.puts('=> Server listening on http://127.0.0.1:'+ port +' (pid:' + process.pid +')')
    if (slaves > 0) {
        s = net.Server(function(c) { 
            // sys.puts('=> Creating socket')
            c.write('blah', 'ascii', http_server.fd);
            c.end();
        }); 
        var socket_fd = '/tmp/node_multivariate_server.sock';
        s.listen(socket_fd, function(){
            sys.puts('=> Listening on socket: ' + socket_fd)
            for (var i = 0; i < slaves; i++){
                var child_process = require('child_process');
                var child = child_process.spawn('node', ['./app/child.js', config.env])
                child.stdout.on('data', function(data) {
                  sys.print(data);
                });
                child.stderr.on('data', function(data) {
                  sys.print(data);
                });
                child.on('exit', function (code) {
                  // sys.print('child process exited with code ' + code);
                  sys.puts('Exiting application...') 
                });
            }
        });
    }

});