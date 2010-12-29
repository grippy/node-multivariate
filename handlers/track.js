function track(req, res, path){
    
    var epoch = helper.epoch();
    var variant_date_key = path + '/' + epoch.toString();
    var parts, test_key, event_name;
    
    if (helper.is_funnel_test(path)){
        parts = path.split('/step');
        test_key = parts[0];
        event_name = parts[1].split('/e/')[1];
    } else {
        parts = path.split('/v');
        test_key = parts[0];
        event_name = parts[1].split('/e/')[1];
    }
    
    
    
    
    Step(
      // Loads two files in parallel
      function lookup_test() {
        // check the cache for this test...
        if (undef(test_cache[test_key])){
            redis.hgetall(test_key, this)
        } else {
            return null
        }
      },
      function track(err, test){
          
          if (test){
              // puts('cache this bitch')
              test = new model.Test().load(test)
              test_cache[test_key] = test
          } else {
              // puts('return from cache')
              test = test_cache[test_key]
          }
          // return response
          end(req, res);
          // update event and date?
          test.update_new_date(epoch)
          test.update_new_event(event_name)
          // doesn't need to return anything...
          redis.incr(variant_date_key)
      }
  )
}
