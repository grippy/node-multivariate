function test_stats(req, res, params){
    var test_key = '/' + params.test_key
    var url = '/stats/test'+ test_key
    puts(test_key)
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
                        url:url
                    }
                    var body = views.test_stats.parse(env)
                    var page = views.layout.parse({body:body, 'title':'stats'})
                        res.body(page)
                        end(req, res)
                
                
                }
            )
    })
    
    // Step(
    //     function fetch(){
    //         // redis.hgetall(test_key, this.parallel())
    //         if (!helper.is_funnel_test(test_key)){
    //             // redis.keys(test_key + '*', this.parallel())
    //         } else {
    //             // redis.keys(test_key + '/step/*', this.parallel())
    //         }
    //     },
    //     function render(err, results){
    //         // res.body(JSON.stringify(sums))
    //         end(req, res)        
    //     }
    // )
}