var util = require('util'),
	config = require('../app/config').init(),
    model = require('../models');

var args = process.argv.slice(2, process.argv.length)
var fixture = require('../fixtures/' + config.env);
var redis = config.redis

function print(s){util.print(s)}
function puts(s){util.puts(s)}
function inspect(o){puts(util.inspect(o))}

// var keys=[]
// args.forEach(function(s){
//     if(s!='production' || s!='development' || s!='testing'){
//         keys.push(s)
//     }
// })
// 
// // no args passed so load them all...
// if(!keys.length){
//     
// }

puts('--------------------------')
puts('Tests for ' + config.env)
puts('--------------------------')
for(var i=0, ii=fixture.tests.length, test; i<ii;i++){
    test = fixture.tests[i]
    puts(i + '. ' + test.name)
}
var i=0, test_name=[], test_print=[];
for(var p in fixture.tests){
    test = fixture.tests[p]
    test_name.push(p)
    test_print.push(i + '. ' + test.name)
    i++
}



function print_tests(){
    puts(test_print.join('\n'))
    puts('--------------------------')
    puts('Command flags:')
    puts('  -r : reset all keys for test (includes stats and counters)')
    puts('Enter test number or name to load:')
    puts('--------------------------')
}

function load_test(name, reset){
    var props = fixture.tests[name]
    if (props != undefined){
        puts('=> New test values...')
        inspect(props)
    
        var test = new model.Test().base(props)
        var save_callback = function(err, success){
            // inspect(test)
            puts('--------------------------')
            print_tests()
        }
    
        if(reset){
            puts('=> Reseting Test and Removing all Keys...')
            test.reset(function(err, success){
                test.save(save_callback)
            })
        } else {
            puts('=> Saving Test Metadata...')
            test.save(save_callback)
        }
        
    } else {

        puts('--------------------------')
        puts('!!!!!!!!!!!!!!!!!!!!!!!!!!')
        puts('No props loaded for ' + name)
        puts('!!!!!!!!!!!!!!!!!!!!!!!!!!')
        puts('--------------------------')
        print_tests()
    }

}
print_tests()

var stdin = process.openStdin();
stdin.setEncoding('utf8');

stdin.on('data', function (chunk) {
    chunk = chunk.replace(/^\s+|\s+$/g, '')
    if (chunk.length == 0){
        puts('=> Missing input: type test name or number')
        return
    }
    puts('--------------------------')
    var reset = false;
    if (chunk.indexOf('-r') > -1){
        chunk=chunk.replace('-r','').replace(/^\s+|\s+$/g, '')
        reset=true
    }
    
    var parts = chunk.split(' ') // trim whitespace
    var is_num = new RegExp(/^[0-9]/);
    var name = parts[0]
    var num = parseInt(parts[0])
    
    if (is_num.test(name)){
        name = test_name[num]
    }
    
    // complete all the passed vars
    var args = [name].concat(parts.slice(1, parts.length))

    // inspect(fixture.tests)
    for(var i=0,ii=args.length,arg; i<ii;i++){
        arg=args[i]
        load_test(arg, reset)
    }

    // process.stdout.write(chunk);
});

stdin.on('end', function () {
  process.stdout.write('end');
});