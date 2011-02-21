////////////////////////////////////////////////////////
// Page Test...
//

function page_test(req, res, path, params){
    puts(path)
    var user_agent = (params.user_agent!=undefined) ? unescape(params.user_agent) : '';
    if (!crawler(user_agent)) {
        var test_key = path
        var epoch = helper.epoch()
        var test_count_key = test_key + '/count'
        
        Step(

          function get() {
            // bump test count
            redis.incr(test_count_key, this.parallel())
            // check cache for this test
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
                  var result = {
                    name: test.name,
                    type: test.type,
                    variant: variant
                  }
                  res.body(JSON.stringify(result))
                  end(req, res)
                  
                  // update new data
                  test.update_new_date(epoch)
                  
                  // update the variant count here...
                  var variant_date_key = test_key + '/v/' + variant + '/' + epoch.toString()
                  // doesn't need to return anything...
                  redis.incr(variant_date_key)
            } else {
              res.body('// no test exists with this key')
              end(req, res) 
            }
          }
        )
    } else {
        // we have a crawler...
          var result = {
            name: params.name,
            type: 'p',
            variant: 'a'
        }
        res.body(JSON.stringify(result))
        end(req, res)        
    }

}
