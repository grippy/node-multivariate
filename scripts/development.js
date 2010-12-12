var sys = require('sys'),
    child_process = require('child_process');

// grab the args and pass them along to the app
var args = process.argv.slice(2, process.argv.length)
/*
    The development server uses autoexit to monit file changes and then restarts...
    This creates a parent/child which restarts the server on file change.

    commands...
    start - node scripts/development.js
    
*/
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
      sys.puts('') 
      spawn()
    }); 
    // sys.puts('Child ' + child.pid)
}

// start this sucker up! 
spawn()
