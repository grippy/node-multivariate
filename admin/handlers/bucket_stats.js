function bucket_stats(req, res, params){
    var bucket_key = '/' + params.bucket_key
    var buckets_key = bucket_key.split('/b')[0] + '/buckets'
    var url = '/stats/bucket'+ bucket_key
    puts(bucket_key)
    // fetch the json stats for this key...
    get(url, function(results){
        var env = {
            stats:JSON.parse(results),
            bucket_key:bucket_key,
            buckets_key:buckets_key,
            url:url
        }
        var body = views.bucket_stats.parse(env)
        var page = views.layout.parse({body:body, 'title': bucket_key + ' stats'})
            res.body(page)
            end(req, res)
    })

}