var sys = require('sys'), 
    Step = require('../app/step'),
    Model = require('../app/model').Model,
    Extend = require('../app/model').Extend,
    config = require('../app/config').init();

var redis = config.redis

function Test(){return this}
Test.prototype = {
    
    // properties:{
    //     'key': prop.string({empty:null, nullable:false}),
    //     'name': prop.string({empty:'Loser', nullable:false, max:140, match:'reg ex pattern'}),
    //     'type': prop.enums({empty:null, nullable:false, options:['p','f','m']}),
    //     'site': prop.string({empty:null, nullable:false}),
    //     'variants': prop.string({empty:null, nullable:false}),
    //     'distribution': prop.list({empty:null, nullable:false}),
    //     'spread': prop.string({empty:null, nullable:false}),
    //     'dates': prop.string({empty:'', nullable:false}),
    //     'events': prop.string({empty:'', nullable:false})
    // },
    
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
    
    base:function(props){
        // add some property checks here...
        var errors = []
        
        // check for minimum properties and throw error if missing
        var keys = ['name', 'type', 'variants', 'distribution']
        for (var i=0, ii=keys.length, key; i<ii;i++){
            key = keys[i]
            if (props[key] == undefined){
                throw new Error('Missing required property: ' + key);
            }
        }
        
        //check type
        var pass = false;
        for (var i=0, allowed=['p', 'f', 'm'], ii=allowed.length; i < ii; i++){
            if (props.type == allowed[i]){
                pass = true;
                break
            }
            
        }
        if (!pass) errors.push('type must be p, f, m')
        
        // determine the spread from the variant distro:
        var variants = props.variants.split(','),
            distro = props.distribution.split(',')
        
        // just-in-case a spread was passed in the props...
        if (props.spread == undefined){
            // check distro to make sure it equals 100
            var cnt=0;
            for(var i=0, ii=distro.length;i<ii;i++){
                cnt+=parseInt(distro[i], 10)
            }
            if (cnt != 100){
                errors.push('distribution must be equal to 100')
            }
            
            var cnt=0, spread = '', tmp='', percent;
            for (var i=0, ii=distro.length; i < ii; i++){
                    cnt = parseInt(distro[i], 10);
                    variant = variants[i]
                    while(cnt > 0){
                        spread += variant;
                        cnt--
                    }
                }
            // set spread
            props.spread = spread
        }

        // check spread...
        if (props.spread.length != 100){
            errors.push('spread must be exactly 100 characters')
        }
        // check to see if this is a funnel test
        if (props.type=='f'){
            if (props.steps == undefined){
                errors.push('steps must contain a value for funnel tests')
            } else if(props.steps.length == 0){
                errors.push('steps must contain a value for funnel tests')
            }
        }
        // set default active if missing...
        if (props.active == undefined){
            props.active = false;
        }
        // throw errors...
        if (errors.length){
            throw new Error(errors.join('\n'))
        }
        // set empty values...        
        props.dates=''
        props.events=''
        // take the loaded values and create key:
        props.key = '/s/' + props.site + '/' + props.type + '/t/' + props.name;        
        // sys.puts(sys.inspect(props))

        // pass to create, load, and mark dirty...
        this.create(props)
        return this
    },

    save:function(cb){
        var callback = (arguments.length) ? arguments[0] : function(err, success){};
        var dirty = this.dirty_props();
        if (dirty[0]){
            var self = this;
            redis.hmset(dirty[0], dirty[1], callback)
        } else {
            // nothing dirty...
            callback(null, null)
        }

    },
    
    reset:function(){
        // reset all the redis keys for this.key
        var callback = (arguments.length) ? arguments[0] : function(err, success){};
        var self = this;
        Step(
            function keys(){
                // redis.hgetall(self.key, this.parallel())
                var key = self.key + '/*'
                redis.keys(key, this)
            },
            function remove(err, keys){
                if (err) throw err;
                
                if(keys.length){
                    var group = this.group();
                    keys = keys.sort()
                    keys.forEach(function(k){
                        var key = k.toString()
                        sys.puts(key)
                        redis.del(key, group())
                    })
                    
                } else {
                    return 0
                }
            },
            function(err, success){
                if(err) throw err;
                if(success){
                    sys.puts('Success!')
                } else {
                    sys.puts('Nothing to delete')
                }
                return null
            },
            callback
            
        )
        this.events='';
        this.dates='';

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


