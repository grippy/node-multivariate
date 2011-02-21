function track(req, res, path, params){
    // return response
    end(req, res);
    // inspect(params)

    var site = params.site
    var epoch = helper.epoch();
    var variant_date_key = path + '/' + epoch.toString();
    var parts, test_key;
    
    if (helper.is_funnel_test(path)){
        var pattern = new RegExp(/^\/s\/([a-zA-Z0-9,-.%_~;]*)\/([a-zA-Z0-9,-.%_~;]*)\/t\/([a-zA-Z0-9,-.%_~;]*)\/step\/([a-zA-Z0-9,-.%_~;]*)\/v\/([a-zA-Z0-9,-.%_~;]*)\/e\/([a-zA-Z0-9,-.%_~;]*)/)
        parts = pattern.exec(path)
        // inspect(parts)
        params.type = parts[2]
        params.step = parts[4]
        params.variant = parts[5]
        params.event_name = parts[6]
        params.test_key = path.split('/step')[0]
    } else {
        // module or page here...
        var pattern = new RegExp(/^\/s\/([a-zA-Z0-9,-.%_~;]*)\/([a-zA-Z0-9,-.%_~;]*)\/t\/([a-zA-Z0-9,-.%_~;]*)\/v\/([a-zA-Z0-9,-.%_~;]*)\/e\/([a-zA-Z0-9,-.%_~;]*)/)
        parts = pattern.exec(path)
        params.type = parts[2]
        params.variant = parts[4]
        params.event_name = parts[5]
        params.test_key = path.split('/v')[0]
    }
    
    // set the test key
    test_key = params.test_key
    
    var data = params.data;
    if(data){
        var data_key = test_key.replace(site, site + '/data')
        puts(data_key)
        data = qs.parse(data);
        data['mv_date'] = helper.format_epoch(helper.epoch())
        data['mv_test_name'] = params.name
        data['mv_test_variant'] = params.variant
        data['mv_test_event'] = params.event_name
        data['mv_test_type'] = params.type
        if (params.step != undefined) data['mv_test_step'] = params.step
        redis.lpush(data_key, JSON.stringify(data))
        inspect(data)
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
          // update event and date?
          test.update_new_date(epoch)
          test.update_new_event(params.event_name)
          // doesn't need to return anything...
          redis.incr(variant_date_key)
      }
  )
}
