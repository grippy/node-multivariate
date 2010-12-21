////////////////////////////////////////////////////////
// Track Bucket Value...
//
function track_bucket_value(req, res, path, params){
    // kill the response now...
    end(req, res)
    
    var test_key = path
    var epoch = helper.epoch()
    var bucket_date_key = test_key + '/' + epoch.toString()
    
    
    // incr bucket date key
    redis.incr(bucket_date_key)
    
    // check to see if this is a new bucket key
    var site_buckets_key = test_key.split('/b')[0] + '/buckets'
    var bucket_members = bucket_members_cache[site_buckets_key]
    
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
