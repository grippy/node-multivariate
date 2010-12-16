////////////////////////////////////////////////////////
// Stats for Test Key...
//
function test_stats(req, res, params){
    var test_key = '/'+ params.test_key
    var test_loaded;
    Step(
        function get_all_keys(){
            redis.hgetall(test_key, this.parallel())
            if (!helper.is_funnel_test(test_key)){
                redis.keys(test_key + '*', this.parallel())
            } else {
                redis.keys(test_key + '/step/*', this.parallel())
            }
        },
        function lookup_all_keys(err, test, keys){
            // inspect(test)
            if (err) throw err;
            // group these calls together
            var group = this.group();
            test_loaded = new model.Test().load(test)
            test_loaded.stats = {}
            test_loaded.stats.keys = []
            keys = keys.sort()
            
            if (!helper.is_funnel_test(test_key)){
                keys=keys.slice(1, keys.length);
            }
            if (keys.length){
                keys.forEach(function(k){
                    var key = k.toString()
                    // puts(key)
                    test_loaded.stats.keys.push(key)
                    redis.get(key, group())
                })
            } else {
                // return an empty results set since no keys exist
                return []
            }
        },
        function render(err, results){
            if (err) throw err;
            var key;
            results.forEach(function(val, i){
                key = test_loaded.stats.keys[i]
                val = parseInt(val.toString(), 10)
                test_loaded.stats[key] = val
            })
            // for (var i=0; i < results.length; i++){
            //     key = test_loaded.stats.keys[i]
            //     val = parseInt(val.toString(), 10)
            //     test_loaded.stats[key] = val
            // }


            // inspect(test_loaded.stats)
            var sums = test_loaded.stat_sum()
            // inspect(results)
            // if (config.env =='development'){
            //     res.body('/*\n')
            //     res.body('test sums:\n')
            //     res.body(sys.inspect(sums, true, 3))
            //     res.body('\n*/\n')
            // }
            res.body(JSON.stringify(sums))
            end(req, res)        
        }
    )
}