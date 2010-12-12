var sys = require('sys'), 
    redis = require('../app/redis-node'),
    environment = require('../config/environment')

function puts(s){sys.puts(s)}
function inspect(o){puts(sys.inspect(o))}

var env = 'development',
    app_cmd = ''; // start (default), stop, restart / only in production mode

function parse_env(){
    var args = process.argv
    var envs = ['production', 'testing']
    envs.forEach(function(e){
        if (args.toString().indexOf(e) > -1) {
            env = e;
        };
    })
}

function parse_argv(){
    var args = process.argv
    for(var i=0; i < args.length; i++){
        arg = args[i];
        if (arg.indexOf('-')==0){
            // if (arg.indexOf('-p') > -1){
            //     port = args[i + 1]
            // }
            if (arg.indexOf('-c') > -1){
                app_cmd = args[i + 1]
            }
        }
    }
}

exports.init = function(){
    // override default if one was passed to config init...
    if (arguments.length) env = arguments[0]
    
    if (global.config == undefined) {
        parse_env()
        parse_argv()
        var config = eval('environment.' + env)
        config.env = env;
        config.app_cmd = app_cmd;
        config.redis = redis.createClient(config.redis_port, config.redis_host)
        
        // By default, the redis client connects to db0. 
        // Check to make sure we don't need to select a different db
        if (config.redis_db != 0){
            config.redis.select(config.redis_db, function(err, connected){
                if (connected){
                    puts('=> Connected to redis db' + config.redis_db)
                }
            })
        } else {
            puts('=> Connected to redis db: ' + config.redis_db)
        }    
        global.config = config
    }
    return global.config
}