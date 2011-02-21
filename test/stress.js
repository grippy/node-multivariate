var util = require('util'),
	child_process = require('child_process');

// util.puts('=> Motorhead pid: ' + process.pid)
// var args = process.argv.slice(2, process.argv.length)

function spawn(proc, args){
    var child = child_process.spawn(proc, args)
    child.stdout.on('data', function(data) {
      util.print(data);
    });
    child.stderr.on('data', function(data) {
      util.print(data);
    });
    child.on('exit', function (code) {
      // util.print('child process exited with code ' + code);
      util.puts('Exiting application...') 
    }); 
}

spawn('ab', ['-n', '1000', '-c', '1', 'http://squabl.com/s/domain.com/p/t/page_test'])
// spawn('ab', ['-n', '1000', '-c', '1', 'http://squabl.com/s/domain.com/p/t/page_test/v/a/e/fuck'])
// spawn('ab', ['-n', '1000', '-c', '1', 'http://squabl.com/s/domain.com/p/t/page_test/v/a/e/shit'])

// /s/domain.com/p/t/page_test/v/a/e/fuck_yeah

// spawn('ab', ['-n', '10000', '-c', '1', 'http://squabl.com/s/domain.com/f/t/funnel_test'])
// spawn('ab', ['-n', '10000', '-c', '1', 'http://squabl.com/s/domain.com/f/t/funnel_test/v/a/e/fuck'])
// spawn('ab', ['-n', '10000', '-c', '1', 'http://squabl.com/s/domain.com/f/t/funnel_test/v/a/e/shit'])
// spawn('ab', ['-n', '10000', '-c', '1', 'http://squabl.com/s/domain.com/m/t/module_test'])
// spawn('ab', ['-n', '10000', '-c', '1', 'http://squabl.com/s/domain.com/m/t/module_test/v/a/e/fuck'])
// spawn('ab', ['-n', '10000', '-c', '1', 'http://squabl.com/s/domain.com/m/t/module_test/v/a/e/shit'])
// spawn('ab', ['-n', '1000', '-c', '1', 'http://squabl.com/s/domain.com/b/cart/checkout'])
// spawn('ab', ['-n', '1000', '-c', '1', 'http://squabl.com/s/domain.com/b/cart/abandon'])

    