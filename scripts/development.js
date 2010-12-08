var sys = require('sys'),
    child_process = require('child_process');

sys.puts('=> multivariate pid: ' + process.pid)
var args = process.argv.slice(2, process.argv.length)

function spawn(){
    var child = child_process.spawn('node', ['app.js'].concat(args))
    child.stdout.on('data', function(data) {
      sys.print(data);
    });
    child.stderr.on('data', function(data) {
      sys.print(data);
    });
    child.on('exit', function (code) {
      // sys.print('child process exited with code ' + code);
      sys.puts('Exiting application...') 
      spawn()
    }); 
    // sys.puts('Child ' + child.pid)
}

// start this sucker up! 
spawn()
