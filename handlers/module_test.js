////////////////////////////////////////////////////////
// Module Test...
//
function module_test(req, res, path, params){
    var test_key = path
    var epoch = helper.epoch()
    var test_count_key = test_key + '/count'
    
    Step(
      function get() {
          // bump test count
          redis.incr(test_count_key, this.parallel())
          // check the cache for this test...
          if (undef(test_cache[test_key])){
            redis.hgetall(test_key, this.parallel())
          }
      },
      function render(err, test_count, test){
          
          if (test){
              // puts('cache this bitch')
              test = new model.Test().load(test)
              test_cache[test_key] = test
          } else {
              // puts('return from cache')
              test = test_cache[test_key]
          }
          
          if (not_undef(test)) {
              
              var i = test_count % 100;
              var variant = test.spread.charAt(i)
          
              var result = JSON.stringify({
                // key: test.key,
                name: test.name,
                type: test.type,
                variant: variant
              })
              if (not_undef(params.jsonp)){
                  res.body(params.jsonp + '('+ result +');')
              } else {
                  res.body(result)
              }
              
              // end response
              end(req, res)
          
              // update date
              test.update_new_date(epoch)          

              // update the variant count here...
              var variant_date_key = test_key + '/v/' + variant + '/' + epoch.toString()
              redis.incr(variant_date_key)          
              
          } else {
              
              res.body('// no test exists with this key')
              end(req, res)              
              
          }
      }
  )
}