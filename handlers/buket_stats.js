////////////////////////////////////////////////////////
// Stats for Bucket Key...
//
function bucket_stats(req, res, params){
    // inspect(params)
    
    var bucket_key = '/s/' + params.site + '/b/'+ params.name
    // puts(bucket_key)
    
    var bucket = new model.Bucket()
    bucket.name = params.name;
    
    Step(
        function get_all_keys_for_bucket(){
            redis.keys(bucket_key + '*', this)
        },
        function lookup_all_keys(err, keys){
            var group = this.group();
            keys = keys.sort()
            bucket.stats = {}
            bucket.stats.keys = []
            keys.forEach(function(k){
                var key = k.toString()
                bucket.stats.keys.push(key)
                redis.get(key, group())
            })
        },
        function render(err, results){
            // inspect(bucket.stats)
            // inspect(results)
            var key, parts, key_changed, dt, dates=[], name, names=[], totals={}, count, date_totals={};
            results.forEach(function(val, i){
                key = bucket.stats.keys[i]
                parts = key.replace(bucket_key + '/', '').split('/')
                name=parts[0];
                dt = bucket.format_epoch(parts[1])
                key_changed = name + '/' + dt
            
                if (!dates.contains(dt)) dates.push(dt)
                if (!names.contains(name)) names.push(name)
                count = parseInt(val.toString(), 10)
                // bucket.stats[key_changed] = count
                if (totals[name] == undefined){
                    totals[name] = 0
                }
                totals[name] += count
            
                if(date_totals[dt] == undefined){
                    date_totals[dt]={}
                }
                if(date_totals[dt][name] == undefined){
                    date_totals[dt][name] = 0
                }
                date_totals[dt][name] += count
            })
            bucket.stats.dates = dates.sort();
            bucket.stats.names = names.sort();
            bucket.stats.name_totals = totals;
            bucket.stats.date_totals = date_totals
            
            delete bucket.stats.keys
            
            // res.body(sys.inspect(bucket.stats))
            res.body(JSON.stringify(bucket.stats))
            end(req, res)
        }
    )
}
