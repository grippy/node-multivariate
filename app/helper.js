exports.helper = {
    has_variant:function(key){
        return (key.indexOf('/v/') > -1)
    },
    has_event:function(key){
        return (key.indexOf('/e/') > -1)
    },
    has_step:function(key){
        return (key.indexOf('/step/') > -1)
    },
    is_bucket_test:function(key){
        return (key.indexOf('/b/') > -1)
    },
    is_page_test:function(key){
        return (key.indexOf('/p/') > -1)
    },
    is_funnel_test:function(key){
        return (key.indexOf('/f/') > -1)
    },    
    is_module_test:function(key){
        return (key.indexOf('/m/') > -1)
    },
    datestamp:function(key, epoch){
        return key + '/' + epoch.toString()
    },
    epoch:function(){
        var dt = new Date();
        dt.setHours(0)
        dt.setMinutes(0)
        dt.setSeconds(0)
        dt.setMilliseconds(0)
        return dt.getTime()
    }
}