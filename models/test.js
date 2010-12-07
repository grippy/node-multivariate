var sys = require('sys'), 
    Model = require('../app/model').Model,
    Extend = require('../app/model').Extend,
    config = require('../app/config').init(),
    redis = config.redis

function Test(){return this}
Test.prototype = {
    init:function(){},
    
    // hash values contain string lists...
    set_unique_list_prop:function(key, val){
        val = val.toString();
        
        // check to see if this property is defined...
        if (this[key] == undefined) {
            this['__' + key] = null;
            this[key] = null;
        }
        if (!this[key]){
          this[key] = val;
        } else {
          if (this[key].indexOf(val) == -1){
              this[key] += ',' + val;
          }
        }
        
    },
    update_new_date:function(epoch){
        this.set_unique_list_prop('dates', epoch)
        var dirty = this.dirty_props();
        if (dirty[0]){
          redis.hmset(dirty[0], dirty[1])
          this.__dates = this.dates // we need to update the __value so it isn't marked dirty
        }
        
    },
    update_new_event:function(name){
        this.set_unique_list_prop('events', name)
        var dirty = this.dirty_props();
        if (dirty[0]){
          redis.hmset(dirty[0], dirty[1])
          this.__events = this.events // we need to update the __value so it isn't marked dirty
        }
    },
    
    format_epoch:function(e){
        var d = new Date(parseInt(e, 10));
        return d.getFullYear().toString() + '-' + (d.getMonth() + 1).toString() + '-' + d.getDate().toString()
    },
    get_stat_val:function(key){
        if (this.stats[key] != undefined){
            return this.stats[key]
        }
        return 0
    },
    first_step:function(){
        if (this._first_step == undefined){
            this._first_step = this.steps.split(',')[0]
        }
        
        return this._first_step
    },
    next_step:function(s){
        var _steps = this.steps.split(',')
        for(var i=0; i < _steps.length; i++){
            if(s==_steps[i] && _steps[i+1] != undefined){
                return _steps[i+1]
            }
        }
        return null;
    },
    stat_sum:function(){
      if(this.type=='m' || this.type=='p'){
          return this.page_stat_sum()
      } else {
         return this.funnel_stat_sum()
      }
    },
    
    page_stat_sum:function(){
        // aggregate all date stats for base key
        var test_key = this.key;
        var dates = (this.dates) ? this.dates.split(',') : [];
    
        
        var events = (this.events) ? this.events.split(',') : [];
        var variants = this.variants.split(',');
        
        var v_key, e_key, d_key;
        var v_val, e_val, d_val;
        var val;
        var v_totals = {}
        var v_dates = [], v_date, v_date_temp;
        
        var e_totals = {}
        var e_dates = [], e_date, e_date_temp;
        
        var v_total=0, e_total=0; // total of each type
        var v, e, d;
        
        var date_formats = [], date_format;
        
        for(var i=0; i < variants.length; i++){
            v = variants[i];
            v_key = test_key + '/v/' + v;
            v_totals[v] = 0;
            
            // grab all the variants by saved dates
            for(var k=0; k < dates.length; k++){
                d = dates[k];
                d_key = v_key + '/' + dates[k];
                val = this.get_stat_val(d_key)
                
                v_date = {}
                v_date_temp = {}
                v_date_temp[v] = val
                date_format = this.format_epoch(d)
                v_date[date_format] = v_date_temp
                v_dates.push(v_date)
                
                v_totals[v] += val
                v_total += val; 
                
                if (date_formats.toString().indexOf(date_format) == -1) {
                    date_formats.push(date_format)
                }

            }
            // grab all the variants and events by saved dates
            for(var j=0; j < events.length; j++){
                e = events[j];
                e_key = v_key + '/e/' + e
                if (e_totals[e] == undefined) e_totals[e] = 0;
                for(var k=0; k < dates.length; k++){
                    d = dates[k];
                    d_key = e_key + '/' + dates[k]
                    val = this.get_stat_val(d_key)
                    
                    e_date = {};
                    e_date_temp = {};
                    e_date_temp[v + '/' + e] = val;
                    e_date[this.format_epoch(d)] = e_date_temp;
                    e_dates.push(e_date);
                    
                    e_totals[e] += val;
                    e_total += val;
                }
            }
        }
        
        // sys.puts('v_totals: ' + sys.inspect(v_totals))
        // sys.puts('v_dates: ' + sys.inspect(v_dates))
        // 
        // sys.puts('v_total: ' + v_total)
        // sys.puts('---')
        // sys.puts('e_totals: ' + sys.inspect(e_totals))
        // sys.puts('e_dates: ' + sys.inspect(e_dates))
        // sys.puts('e_total: ' + e_total)
        // sys.puts('---')
        // sys.puts(sys.inspect(date_formats))
        
        return {
            variant_total:v_total,
            variant_totals:v_totals,
            variant_dates:v_dates,
            
            event_total:e_total,
            event_totals:e_totals,
            event_dates:e_dates,
            dates:date_formats
        }
    },
    
    funnel_stat_sum:function(){
        
        var test_key = this.key;
        var dates = (this.dates) ? this.dates.split(',') : [];
        var events = (this.events) ? this.events.split(',') : [];
        var variants = this.variants.split(',');        
        var steps = this.steps.split(',');

        var variant_pattern = new RegExp(/^\/s\/([a-zA-Z0-9,-.%_~;]*)\/f\/t\/([a-zA-Z0-9,-.%_~;]*)\/step\/([a-zA-Z0-9,-.%_~;]*)\/v\/([a-zA-Z0-9,-.%_~;]*)\/([a-zA-Z0-9,-.%_~;]*)/)
        var variant_parts = "/s/:site/f/t/:name/step/:step/v/:variant/:date"
        
        var event_pattern = new RegExp(/^\/s\/([a-zA-Z0-9,-.%_~;]*)\/f\/t\/([a-zA-Z0-9,-.%_~;]*)\/step\/([a-zA-Z0-9,-.%_~;]*)\/v\/([a-zA-Z0-9,-.%_~;]*)\/e\/([a-zA-Z0-9,-.%_~;]*)\/([a-zA-Z0-9,-.%_~;]*)/)
        var event_parts = "/s/:site/f/t/:name/step/:step/v/:variant/e/:event/:date"
        var params, parts, key;
        
        var v_totals = {}
        var v_dates = {}, v_date;
        
        var e_totals = {}
        var e_dates = {}, e_date;
        
        var v_total=0, e_total=0; // total of each type
        var v, e, d;
        var date_formats = [], date_format;
        
        var event_params = []
        var variant_params = []
        
        for(var i=0; i < dates.length; i++){
            date_formats.push(this.format_epoch(parseInt(dates[i], 10)))
        }
        
        // seperate events from variant keys...
        for(var i=0; i < this.stats.keys.length; i++){
            key=this.stats.keys[i]
            params = {}
            if (event_pattern.test(key)){
                // sys.puts('event')
                parts = event_pattern.exec(key)
                params = {
                    site:parts[1],
                    test_name:parts[2],
                    step:parts[3],
                    variant:parts[4],
                    event_name:parts[5],
                    date:this.format_epoch(parseInt(parts[6], 10)),
                    count:this.stats[key]
                }
                // sys.puts(sys.inspect(params))
                event_params.push(params)
            } else {
                if (variant_pattern.test(this.stats.keys[i])){
                    // sys.puts('variant')
                    // sys.puts(sys.inspect(variant_pattern.exec(this.stats.keys[i])))
                    parts = variant_pattern.exec(key)
                    params = {
                        site:parts[1],
                        test_name:parts[2],
                        step:parts[3],
                        variant:parts[4],
                        date:this.format_epoch(parseInt(parts[5], 10)),
                        count:this.stats[key]
                    }
                    // sys.puts(sys.inspect(params))
                    variant_params.push(params)
                }
            }
        }
        
        for(var i=0; i < event_params.length; i++){
            param = event_params[i]
            if (e_totals[param.event_name]==undefined){
                e_totals[param.event_name]=0
            }
            e_totals[param.event_name] += param.count
            e_total += param.count
            
            if (e_dates[param.date] == undefined){
                e_dates[param.date] = {}
            }
            e_date = e_dates[param.date];
            e_date[param.step + '/' + param.variant + '/' + param.event_name] = param.count;
            e_dates[param.date] = e_date
            
        }

        for(var i=0; i < variant_params.length; i++){
            param = variant_params[i]
            if (v_totals[param.variant]==undefined){
                v_totals[param.variant]=0
            }
            v_totals[param.variant] += param.count
            v_total+=param.count
            
            if (v_dates[param.date] == undefined){
                v_dates[param.date] = {}
            }            
            
            v_date = v_dates[param.date];
            v_date[param.step + '/' + param.variant] = param.count;
            v_dates[param.date] = v_date
            
        }
        return {
            variant_total:v_total,
            variant_totals:v_totals,
            variant_dates:v_dates,
            
            event_total:e_total,
            event_totals:e_totals,
            event_dates:e_dates,
            dates:date_formats,
            events:events,
            variants:variants,
            steps:steps
        }      
        
    },
    
    
    
    end:function(){}
}

Extend(Model, Test)

exports.Test = Test

/*
function column(rule){
    return this
}
var TestSchema = {
    key:column({pattern:'/s/:site/:type/t/:name'}),
    site:column({nullable:false}),
    type:column({nullable:false, values:['m','p']}),
    name:column({nullable:false, unique:true})
}
*/

