////////////////////////////////////////////////////////
// Funnel Test...
//
function funnel_test(req, res, path, params){
    // puts(path)
    // inspect(params)
    var user_agent = (params.user_agent!=undefined) ? unescape(params.user_agent) : '';
    if (!crawler(user_agent)) {
        var step, variant, test_step_key, test_step_count_key, forward=false;
        // puts(unescape(params.state))
        var state = (params.state) ? JSON.parse(unescape(params.state)) : null;
        var test_key = path
        var epoch = helper.epoch()
        
        Step(
          function get_test() {
            // check cache for this test
            // puts('get_test')
            // puts(test_key)
            if (undef(test_cache[test_key])){
                redis.hgetall(test_key, this)
            } else {
                return null
            }
          },
          function get_test_callback(err, props){
              if (props) {
                  test_cache[test_key] = new model.Test().load(props)
              }
              return null
          },
          function set_defaults(err, prev){
                // puts('set_defaults')
                var test = test_cache[test_key]
                 if (state){
                    if (not_undef(state.next_step)) {
                        step = state.next_step;
                    }
                    if (not_undef(state.variant)) {
                        variant = state.variant;
                    }
                }
                var first = test.first_step()
                if (!step) {
                    step = first
                }
                if (step == first) forward = true
                test_step_key = test_key + '/step/' + step;
                return null
            },
            function move_neddle(err, prev){
                if (forward){
                    // puts('incr spread')
                    redis.incr(test_key + '/count', this)
                } else {
                    return null
                }
            },
            function move_neddle_callback(err, count){

                var test = test_cache[test_key]
                if (count) {
                    
                    // count assumes this was just created so it's going to be off by 1
                    variant = test.spread.charAt( (count - 1) % 100 )
                }
                // puts(count)
                // puts(variant)
                // puts(step)
                return null
            },
          
          function render(err, prev){
                // state={%22variant%22:%22a%22,%22next_step%22:%22page2%22}
                var test = test_cache[test_key]
                
              if (not_undef(test)) {

                  var result = {
                    name: test.name,
                    type: test.type,
                    variant: variant,
                    step: step,
                    next_step: test.next_step(step)
                  }
                  result.state = JSON.stringify(result);
                  res.body(JSON.stringify(result))
                  end(req, res)
                  
                  // update date
                  test.update_new_date(epoch)
              
                  // update the variant count here...
                  var variant_date_key = test_step_key + '/v/' + variant + '/' + epoch.toString()
                  redis.incr(variant_date_key)
            } else {
              res.body('// no test exists with this key')
              end(req, res) 
            }
          }
        )
    } else {
        // we have a crawler...
        // need to determine what to do here...
        
          var result = {
            name: params.name,
            type: 'f',
            variant: 'a',
            step: '1',
            next_step:null
          }
        res.body(JSON.stringify(result))
        end(req, res)        
    }

}