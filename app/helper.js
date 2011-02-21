var util = require('util'),
	config = require('./config').init()

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

    /*
        Adjust and rounds the current date to its minimum value.
    */
    epoch:function(){
        var dt = new Date();
        
        // adjust date to some other timezone other then local system?
        // util.puts('Server date:')
        // util.puts(dt.toString())
        var offset = config.app_stats_offset
        if (offset != 0) {
            // adjust via ms so we can also account for a minute offset
            var offset_ms = offset * 3600000
            dt = new Date(dt.getTime() + offset_ms)
            // util.puts('Adjusted date:')
            // util.puts(dt.toString())
        }
        // now round down to midnight...
        dt.setHours(0, 0, 0, 0)
        // util.puts('Redis date:')
        // util.puts(dt.toString())
        return dt.getTime()
    },
    format_epoch:function(e){
        var d = new Date(parseInt(e, 10));
        var month = ((d.getMonth() + 1) > 9) ? (d.getMonth() + 1).toString() : '0' + (d.getMonth() + 1).toString()
        var date = ((d.getDate() > 9) ? d.getDate().toString() : '0' + d.getDate().toString())        
        return d.getFullYear().toString() + '-' + month + '-' + date
    },    
}