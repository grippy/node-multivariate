function buckets(req, res, params){
    var buckets_key = '/' + params.buckets_key
    var site_key = buckets_key.replace('/buckets', '')
    // puts(buckets_key)
    // puts(site_key)
    Step(function list(){
            redis.smembers(buckets_key, this)
        },
        function render(err, results){
            
            // inspect(results)
            var env = {
                buckets_keys:results,
                buckets_key:buckets_key,
                site_key:site_key
            }
            
            var body = views.buckets.parse(env)
            var page = views.layout.parse({body:body, 'title':'buckets'})
                res.body(page)
                end(req, res)
        
        
        }
    )
    
}