var sys = require('sys'),
    fixtures = require('../test/fixtures'),
    config = require('./app/config').init(),
    model = require('../models')

var redis = config.redis

function print(s){sys.print(s)}
function puts(s){sys.puts(s)}
function inspect(o){puts(sys.inspect(o))}

puts('Loading fixtures for ' + config.env)

var test = new model.Test().create(fixtures.page_test)
var dirty = test.dirty_props()
if (dirty[0]){
    redis.hmset(dirty[0], dirty[1], function(err, created){
        if(created){
            puts('Created fixtures.page_test')
        }
    })
}

var test = new model.Test().create(fixtures.module_test)
var dirty = test.dirty_props()
if (dirty[0]){
    redis.hmset(dirty[0], dirty[1], function(err, created){
        if(created){
            puts('Created fixtures.module_test')
        }
    })
}

var test = new model.Test().create(fixtures.funnel_test)
var dirty = test.dirty_props()
if (dirty[0]){
    redis.hmset(dirty[0], dirty[1], function(err, created){
        if(created){
            puts('Created fixtures.funnel_test')
            process.kill(process.pid)
        }
    })
}