function test_stats(req, res, params){
    var test_key = '/' + params.test_key
    var url = '/stats/test'+ test_key
    // puts(test_key)
    // fetch the json stats for this key...
    get(url, function(results){
            Step(function test_metadata(){
                    redis.hgetall(test_key, this)
                },
                function render(err, props){
                    
                    var test = new model.Test().load(props)
                    var env = {
                        test:test,
                        stats:JSON.parse(results),
                        test_key:test_key,
                        test_data_key:test.key.replace('/' + test.type, '/data/' + test.type),
                        url:url
                    }
                    var body = views.test_stats.parse(env)
                    var page = views.layout.parse({body:body, 'title': test.name + ' stats'})
                        res.body(page)
                        end(req, res)
                }
            )
    })

}