var util = require('util'),
    child_process = require('child_process'),
    assert = require("assert"),
    http = require('http'),
    fixture = require('../fixtures/testing'),
    Step = require('../app/step')


// push the testing param on to the args...
process.argv.push('testing')

// pull out the scope, remove the cancer...
var model, config, redis, client, helper, testing_app_pid

function print(s){util.print(s)}
function puts(s){util.puts(s)}
function inspect(o){puts(util.inspect(o, false, null))}
function error(e){
    //puts(e.name + ': ' + e.message)
    e.stack.split('\n').forEach(function(s){
        puts(s)
    })
    puts('------------------------------------')
}

function start_testing(){
    puts('')
    puts('Running tests...')
    
    var module_test = new model.Test().base(fixture.tests.module_test)
    var page_test = new model.Test().base(fixture.tests.page_test)
    var funnel_test = new model.Test().base(fixture.tests.funnel_test)
    
    Step(
        
        // remove all keys in testing db
        function flush_testing_db(){
            puts('=> flush_testing_db')
            redis.flushdb(this)
        }, 
        function flush_testing_db_callback(err, result){
            if (err) error(err);
            assert.ok(result)
            return true
        },
        
        // create page
        function create_page_test(err, prev){
            if (err) error(err);
            puts('=> create_page_test')
            // var test = new model.Test().create(fixture.tests.page_test);
            // var dirty = test.dirty_props();
            // redis.hmset(dirty[0], dirty[1], this)
            page_test.save(this)
        },
        function create_page_test_callback(err, result){
            if (err) error(err);
            assert.ok(result)
            return true
        },
        
        // test page
        function test_page_test(err, prev){
            if (err) error(err);
            puts('=> page_test')
            redis.hgetall(page_test.key, this)
        },
        function page_test_callback(err, result){
            if (err) error(err);
            var test = new model.Test().load(result);
            assert.equal(test.name, 'page_test')
            return true
        },
        
        // page_test_api
        function page_test_api(err, prev){
            if (err) error(err);
            puts('=> page_test_api')
            var group = this.group();
            get_group(page_test.key, group)
            
        },
            function page_test_api_1(chunk){
                // validate the api response
                var r = JSON.parse(chunk.toString())
                assert.equal(r.name, 'page_test')
                assert.equal(r.variant, 'b')
                assert.equal(r.type, 'p')
                
                // fire off some test requests...
                var group = this.group();
                for(var i=0; i < 49; i++){
                    get(page_test.key, function(c){
                        // inspect(c.toString())
                    })
                }
                // fire off some test variant event requests...
                var event_key = key(page_test.key, 'v', 'a', 'e', 'whatevs');
                // puts(event_key)
                for(var i=0; i < 69; i++){
                    get(event_key, function(c){
                        // inspect(c.toString())
                    })
                }
                event_key = key(page_test.key, 'v', 'b', 'e', 'foreals');
                // puts(event_key)                
                for(var i=0; i < 19; i++){
                    get(event_key, function(c){
                        // inspect(c.toString())
                    })
                }
                var test_stats_key = key('/stats','test' + page_test.key)
                // puts(test_stats_key)
                get_group(test_stats_key, group)
        
            },
                // check both the test count and variant count 
                function page_test_api_1a(stats){
                     stats = JSON.parse(stats)
                     puts('=> page test stats')
                     inspect(stats)
                     var date = stats.dates[0]
                     assert.equal(stats.variant_total, 50)
                     assert.equal(stats.variant_totals.a, 25)
                     assert.equal(stats.variant_totals.b, 25)
                     assert.equal(stats.event_total, 88)
                     assert.equal(stats.event_totals['a/whatevs'], 69)
                     assert.equal(stats.event_totals['b/foreals'], 19)
                     assert.equal(stats.variant_dates[date]['a'], 25)
                     assert.equal(stats.variant_dates[date]['b'], 25)
                     assert.equal(stats.event_dates[date]['a/whatevs'], 69)
                     assert.equal(stats.event_dates[date]['b/foreals'], 19)
                     
                     return true
                 },
        
        // create module
        function create_module_test(err, prev){
            if (err) error(err);
            puts('=> create_module_test')
            // var test = new model.Test().create(fixture.tests.module_test);
            // var dirty = test.dirty_props();
            // redis.hmset(dirty[0], dirty[1], this)
            module_test.save(this)
        },
        function create_module_test_callback(err, result){
            if (err) error(err);
            assert.ok(result)
            return true
        },
        
        // test module...
        function test_module_test(err, prev){
            if (err) error(err);
            puts('=> module_test')
            // was this model saved?
            redis.hgetall(module_test.key, this)
        },
        function module_test_callback(err, result){
            if (err) error(err);
            var test = new model.Test().load(result);
            assert.equal(test.name, 'module_test')
            return true
        },
        
        // module_test_api
        function module_test_api(err, prev){
            if (err) error(err);
            puts('=> module_test_api')
            var group = this.group();
            get_group(module_test.key, group)
        },
            function module_test_api_1(chunk){
                // validate the api response
                var r = JSON.parse(chunk.toString())
                // inspect(r)
                assert.equal(r.name, 'module_test')
                assert.equal(r.variant, 'b') // it's 50,50 so this is going to be 'a'
                assert.equal(r.type, 'm')
                
                // fire off some test requests...
                var group = this.group();
                for(var i=0; i < 49; i++){
                    get(module_test.key, function(c){
                        // inspect(c.toString())
                    })
                }
                // fire off some test variant event requests...
                var event_key = key(module_test.key, 'v', 'a', 'e', 'whatevs');
                // puts(event_key)
                for(var i=0; i < 101; i++){
                    get(event_key, function(c){
                        // inspect(c.toString())
                    })
                }
                var event_key = key(module_test.key, 'v', 'b', 'e', 'foreals');
                // puts(event_key)                
                for(var i=0; i < 45; i++){
                    get(event_key, function(c){
                        // inspect(c.toString())
                    })
                }
                var test_stats_key = key('/stats','test' + module_test.key)
                // puts(test_stats_key)
                get_group(test_stats_key, group)
                
            },
                // check both the test count and variant count 
                function module_test_api_1a(stats){
                     // inspect(stats)
                     stats = JSON.parse(stats)
                     puts('=> module test stats')
                     inspect(stats)
                     var date = stats.dates[0]
                     assert.equal(stats.variant_total, 50)
                     assert.equal(stats.variant_totals.a, 25)
                     assert.equal(stats.variant_totals.b, 25)
                     assert.equal(stats.event_total, 146)
                     assert.equal(stats.event_totals['a/whatevs'], 101)
                     assert.equal(stats.event_totals['b/foreals'], 45)
                     assert.equal(stats.variant_dates[date]['a'], 25)
                     assert.equal(stats.variant_dates[date]['b'], 25)
                     assert.equal(stats.event_dates[date]['a/whatevs'], 101)
                     assert.equal(stats.event_dates[date]['b/foreals'], 45)
                     return true
                 },

        // create funnel
        function create_funnel_test(err, prev){
            if (err) error(err);
            puts('=> create_funnel_test')
            // var test = new model.Test().create(fixture.tests.funnel_test);
            // var dirty = test.dirty_props();
            // redis.hmset(dirty[0], dirty[1], this)
            funnel_test.save(this)
        },
        function create_funnel_test_callback(err, result){
            if (err) error(err);
            assert.ok(result)
            return true
        },
        
        // test page
        function test_funnel_test(err, prev){
            if (err) error(err);
            puts('=> funnel_test')
            redis.hgetall(funnel_test.key, this)
        },
        function funnel_test_callback(err, result){
            if (err) error(err);
            var test = new model.Test().load(result);
            assert.equal(test.name, 'funnel_test')
            return true
        },
        
        // funnel_test_api 
        function funnel_test_api(err, prev){
            if (err) error(err);
            puts('=> funnel_test_api')
            var group = this.group();
            get_group(funnel_test.key, group)
        },
            function funnel_test_step_1_api(chunk){
                // validate the api response
                var r = JSON.parse(chunk.toString())
                // inspect(r)
                assert.equal(r.name, 'funnel_test')
                assert.equal(r.variant, 'a') // it's 50,50 so this is going to be since we already check it once 'b'
                assert.equal(r.type, 'f')
                assert.equal(r.step, 'page_1')
                assert.equal(r.next_step, 'page_2')
                
                // let's go through the steps and make sure we stay on the same 
                // var state = JSON.stringify(r)
                var path = funnel_test.key + '?state=' + escape(r.state)
                var group = this.group();
                get_group(path, group)
                
                
            },
            function funnel_test_step_2_api(chunk){
                // validate the api response
                var r = JSON.parse(chunk.toString())
                // inspect(r)
                assert.equal(r.name, 'funnel_test')
                assert.equal(r.variant, 'a') // it's 50,50 so this is going to be since we already check it once 'b'
                assert.equal(r.type, 'f')
                assert.equal(r.step, 'page_2')
                assert.equal(r.next_step, 'page_3')
                // var state = JSON.stringify(r)
                var path = funnel_test.key + '?state=' + escape(r.state)
                var group = this.group();
                get_group(path, group)
            },
            function funnel_test_step_3_api(chunk){
                // validate the api response
                var r = JSON.parse(chunk.toString())
                // inspect(r)
                assert.equal(r.name, 'funnel_test')
                assert.equal(r.variant, 'a') // it's 50,50 so this is going to be since we already check it once 'b'
                assert.equal(r.type, 'f')
                assert.equal(r.step, 'page_3')
                assert.equal(r.next_step, null)
                return true
            },
            function funnel_test_events_api(err, prev){
                if (err) error(err);
                puts("=> funnel_test_events_api")
                // fire of some funnel test first steps 
                var group = this.group();
                for(var i=0; i < 44; i++){
                    // 22 (a) and 22 (b)
                    puts(i)
                    get(funnel_test.key, function(c){
                        //inspect(c.toString())
                    })
                }
                // provide state
                var state 
                state = JSON.stringify({"name":"funnel_test","type":"f","variant":"a","step":"page_2","next_step":"page_3"})
                for(var i=0; i < 34; i++){
                    get(funnel_test.key + '?state=' + escape(state), function(c){
                        // inspect(c.toString())
                    })
                }
                state = JSON.stringify({"name":"funnel_test","type":"f","variant":"a","step":"page_3","next_step":null})
                for(var i=0; i < 24; i++){
                    get(funnel_test.key + '?state=' + escape(state), function(c){
                        // inspect(c.toString())
                    })
                }
                
                // fire off some test variant event requests...
                var event_key = key(funnel_test.key, 'step', 'page_1', 'v', 'a', 'e', 'whatevs');
                // puts(event_key)
                for(var i=0; i < 101; i++){
                    get(event_key, function(c){
                        // inspect(c.toString())
                    })
                }
                
                var event_key = key(funnel_test.key, 'step', 'page_2', 'v', 'a', 'e', 'whatevs');
                // puts(event_key)
                for(var i=0; i < 51; i++){
                    get(event_key, function(c){
                        // inspect(c.toString())
                    })
                }
                var event_key = key(funnel_test.key, 'step', 'page_3', 'v', 'a', 'e', 'whatevs');
                // puts(event_key)
                for(var i=0; i < 12; i++){
                    get(event_key, function(c){
                        // inspect(c.toString())
                    })
                }
                var event_key = key(funnel_test.key, 'step', 'page_1', 'v', 'b', 'e', 'foreals');
                // puts(event_key)                
                for(var i=0; i < 11; i++){
                    get(event_key, function(c){
                        // inspect(c.toString())
                    })
                }
                var event_key = key(funnel_test.key, 'step', 'page_2', 'v', 'b', 'e', 'foreals');
                // puts(event_key)                
                for(var i=0; i < 14; i++){
                    get(event_key, function(c){
                        // inspect(c.toString())
                    })
                }
                var event_key = key(funnel_test.key, 'step', 'page_3', 'v', 'b', 'e', 'foreals');
                // puts(event_key)                
                for(var i=0; i < 53; i++){
                    get(event_key, function(c){
                        // inspect(c.toString())
                    })
                }
                
                var test_stats_key = key('/stats','test' + funnel_test.key)
                get_group(test_stats_key, group)                
                
                // return true
            },
                function funnel_test_events_callback_api(stats){
                    stats = JSON.parse(stats)
                    puts('=> funnel test stats')
                    inspect(stats)
                    var date = stats.dates[0]
                    // puts(date)
                    assert.equal(stats.variant_total, 105)
                    assert.equal(stats.variant_totals.a, 71)
                    assert.equal(stats.variant_totals.b, 34)
                    assert.equal(stats.event_total, 242)
                    assert.equal(stats.event_totals['page_1/a/whatevs'], 101)
                    assert.equal(stats.event_totals['page_2/a/whatevs'], 51)
                    assert.equal(stats.event_totals['page_3/a/whatevs'], 12)
                    assert.equal(stats.event_totals['page_1/b/foreals'], 11)
                    assert.equal(stats.event_totals['page_2/b/foreals'], 14)
                    assert.equal(stats.event_totals['page_3/b/foreals'], 53)
                    assert.equal(stats.variant_dates[date]['page_1/a'], 35)
                    assert.equal(stats.event_dates[date]['page_1/a/whatevs'], 101)
                    return true
                },
                    
        // bucket test
        function bucket_test(err, prev){
            if (err) error(err);
            puts('=> bucket_test')
            var bucket = fixture.bucket_test
            var days = [ 
                ['monday', 25],
                ['tuesday', 34],
                ['wednesday', 22], 
                ['thursday', 3], 
                ['friday', 13], 
                ['saturday', 77], 
                ['sunday', 9]
            ]
            days.forEach(function(a){
                var k = key(bucket, a[0])
                var ub = a[1];
                for(var i=0; i < ub; i++){
                    get(k, function(c){
                        inspect(c.toString())
                    })
                }
            })
            var group = this.group()
            var bucket_stats_key = key('/stats','bucket' + bucket)
            // puts(bucket_stats_key)
            get_group(bucket_stats_key, group)
        },
            // check both the test count and variant count 
            function bucket_test_stats(stats){
                 // inspect(stats)
                 stats = JSON.parse(stats)
                 puts('=> bucket stats')
                 inspect(stats)
                 var bucket = new model.Bucket()
                 var date = bucket.format_epoch(helper.epoch())
                 // puts(date)
                 assert.equal(stats.date_totals[date]['monday'], 25)
                 assert.equal(stats.date_totals[date]['tuesday'], 34)
                 assert.equal(stats.date_totals[date]['wednesday'], 22)
                 assert.equal(stats.date_totals[date]['thursday'], 3)
                 assert.equal(stats.date_totals[date]['friday'], 13)
                 assert.equal(stats.date_totals[date]['saturday'], 77)
                 assert.equal(stats.date_totals[date]['sunday'], 9)
                 return true
             },
        
        // TODO:
        /* test user agent strings... */
        /* test data tracking for buckets and events... */
             
        // kill
        function(err, result){
            if (err) error(err);
            process.kill(testing_app_pid)
            process.kill(process.pid)
        }
    )
}

function stop_testing(){
    process.kill(process.pid)
}

function get_group(url, group){
    puts(url)
    var request = client.request('GET', url, {'host': 'localhost'});
    request.end()
    request.on('response', function(response) {
      response.setEncoding('utf8');
      response.on('data', group());
    });
}

function get(url, cb){
    puts(url)
    var request = client.request('GET', url, {'host': 'localhost'});
    request.end()
    request.on('response', function(response) {
      response.setEncoding('utf8');
      response.on('data', cb);
    });
}



function key(){
    var a = []
    for(var i=0; i < arguments.length; i++){
        a.push(arguments[i])
    }
    return a.join('/')
}


////////////////////////////////////////////////////////////////////////

// add slight delay so config has a chance to select the testing db...
puts('')
puts('Running testing app server...')
var child = child_process.spawn('node', ['app.js', 'testing'])

// grab the testing app pid so we can kill on completion
testing_app_pid = child.pid;

child.stdout.on('data', function(data) {
  if (data.toString().toLowerCase().indexOf('listening') > -1){
      
      // this need to be the first to load config or something else may load the dev config settings...
      config = require('../app/config').init('testing')
      setTimeout(function(){
          client = http.createClient(config.app_port, 'localhost');
          redis = config.redis;
          // delay these so we cache the correct config settings for testing.
          model = require('../models')
          helper = require('../app/helper').helper
          start_testing()
      }, 1000)
  }
  print(data);
});
child.stderr.on('data', function(data) {
  print(data);
});
child.on('exit', function (code) {
  // util.print('child process exited with code ' + code);
  puts('Exiting application...') 
});


