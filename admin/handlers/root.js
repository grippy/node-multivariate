
function root(req, res){
    
    var module_test_re = new RegExp(/\/s\/([a-zA-Z0-9,-.%_~;]*)\/m\/t\/([a-zA-Z0-9,-.%_~;]*)$/)
    var page_test_re = new RegExp(/\/s\/([a-zA-Z0-9,-.%_~;]*)\/p\/t\/([a-zA-Z0-9,-.%_~;]*)$/)
    var funnel_test_re = new RegExp(/\/s\/([a-zA-Z0-9,-.%_~;]*)\/f\/t\/([a-zA-Z0-9,-.%_~;]*)$/)
    var bucket_re = new RegExp(/\/s\/([a-zA-Z0-9,-.%_~;]*)\/buckets$/)
    var module_keys=[], page_keys=[], funnel_keys=[], buckets=[];
    
    Step(function lookup(){
            //grab all the keys loaded in the db matching funnel, module, page, or bucket
            redis.keys('/s*', this)
        },
        function display(err, results){
            if(err) throw err;
            results.sort()
            for(var i=0, ii=results.length, key; i < ii; i++){
                key = results[i]
                // puts(key)
                if (module_test_re.test(key)){
                    module_keys.push(key)
                } else if (page_test_re.test(key)) {
                    page_keys.push(key)
                } else if (funnel_test_re.test(key)) {
                    funnel_keys.push(key)
                } else if (bucket_re.test(key)) {
                    buckets.push(key)
                }
            }
            var body = views.index.parse({module_keys:module_keys, 
                                          page_keys:page_keys, 
                                          funnel_keys:funnel_keys,
                                          buckets:buckets})
            var page = views.layout.parse({body:body, 'title':'homepage'})
            res.body(page)
            end(req, res)
        }
    )
}