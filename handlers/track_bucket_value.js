////////////////////////////////////////////////////////
// Track Bucket Value...
//
function track_bucket_value(req, res, path, params){
    // end response...
    end(req, res)
    
    // make sure we have a value to track here...
    if (params.value.length == 0){return null}
    
    var test_key = path
    var epoch = helper.epoch()
    var bucket_date_key = test_key + '/' + epoch.toString()
    
    // incr bucket date key
    redis.incr(bucket_date_key)
    
    // check to see if this is a new bucket key
    var site_key = test_key.split('/b')[0]
    var site_buckets_key =  site_key + '/buckets'
    var bucket_members = bucket_members_cache[site_buckets_key]
    
    var data = params.data;
    if(data){
        var data_key = site_key + '/data/b/' + params.name
        puts(data_key)
        data = qs.parse(data);
        data['mv_date'] = helper.format_epoch(helper.epoch())
        data['mv_bucket_name'] = params.name
        data['mv_bucket_value'] = params.value
        redis.lpush(data_key, JSON.stringify(data))
        inspect(data)
    }
    
    if (not_undef(bucket_members)){
        if(!bucket_members.contains(params.name)){
            // save here and update cache
            redis.sadd(site_buckets_key, params.name)
            bucket_members.push(params.name)
            bucket_members_cache[site_buckets_key] = bucket_members
        } 
    } else {
        Step(
            function get_members(){
                redis.smembers(site_buckets_key, this)
            },
            function cache(err, members){
                
                var list = []
                members.forEach(function(m){
                    list.push(m.toString())
                })
                if(!list.contains(params.name)){
                    // save here and update cache
                    redis.sadd(site_buckets_key, params.name)
                    list.push(params.name)
                }
                // inspect(list)
                bucket_members_cache[site_buckets_key] = list;
            }
        )


    }
}
