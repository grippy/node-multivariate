var sys = require('sys'),
    http = require('http'),
    net = require('net'),
    fs = require('fs');
    app = require('../app');

/*
    commands...
    start - node scripts/production.js
    stop - noce script/production.js -c stop
    restart - noce script/production.js -c restart
*/
function log_pid(id){
    fs.writeFile('./log/server.'+ id.toString() + '.pid','','utf8', function(e){
        if (e) throw e;
    })
}
function stop(){
    // lookup all the log/process.pids
    var pid, exec = require('child_process').exec;
    var files = fs.readdirSync('./log')
    files.forEach(function(fd, i){
        if (fd.indexOf('.pid') > -1){
            pid = fd.split('server.')[1].split('.pid')[0]
            sys.puts('=> Killing process: ' +  pid)
            exec('kill -9 ' + pid, function (err, stdout, stderr) {
                if (err) sys.puts(sys.inspect(err))
            })
            exec('rm ./log/' + fd, function(err, stdout, stderr){
                if (err) sys.puts(sys.inspect(err))
            })
        }
    })
}
function kill(){
    process.kill(process.pid)
}

function start(){
    var port = config.app_port
    var slaves = (config.app_slaves != undefined) ? config.app_slaves : 0;

    http_server = http.Server(app.handler)
    http_server.port = port;

    http_server.listen(port, function(){
        sys.puts('=> Server listening on http://127.0.0.1:'+ port +' (pid:' + process.pid +')')
        log_pid(process.pid)
    
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
                
                    // save pid file somewhere...
                    // 'node-multivariate-child..pid'
                    log_pid(child.pid)
                
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
}

var config = require('../app/config').init('production')
if (config.env != 'production'){ throw new Error('This script is only recommmeded for production.')}

if (config.app_cmd == 'restart'){
    stop()
    start()
} else if (config.app_cmd == 'stop'){
    stop()
    kill()
} else {
    start()
}


