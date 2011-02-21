var util = require('util'),
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
    
    type_name:function(){
        var s = ''
        if (this.type=='m'){
            s = 'module'
        }else if(this.type=='p'){
            s = 'page'
        }else if(this.type=='f'){
            s = 'funnel'
        }
        return s
    },
    
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
        var month = ((d.getMonth() + 1) > 9) ? (d.getMonth() + 1).toString() : '0' + (d.getMonth() + 1).toString()
        var date = ((d.getDate() > 9) ? d.getDate().toString() : '0' + d.getDate().toString())        
        return d.getFullYear().toString() + '-' + month + '-' + date
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
        props.dates=' '
        props.events=' '
        // take the loaded values and create key:
        props.key = '/s/' + props.site + '/' + props.type + '/t/' + props.name;        
        // util.puts(util.inspect(props))

        // pass to create, load, and mark dirty...
        this.create(props)
        return this
    },

    save:function(){
        var callback = (arguments.length) ? arguments[0] : function(err, success){};
        var dirty = this.dirty_props();
        if (dirty[0]){
            // var self = this;
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
                        util.puts(key)
                        redis.del(key, group())
                    })
                    
                } else {
                    return 0
                }
            },
            function(err, success){
                if(err) throw err;
                if(success){
                    util.puts('Success!')
                } else {
                    util.puts('Nothing to delete')
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
    conversion_rate:function(ecnt, imp){
        return parseFloat(((ecnt / imp) * 100).toFixed(2))
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
        var v_totals = {};
        var v_dates = {};
        var v_events=[];
        var e_totals = {};
        var e_dates = {};
        var v_total=0, e_total=0; // total of each type
        var v, e, d;
        var variant_event_name;
        var c_totals = {} // conversion totals
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
                
                // v_date = {}
                // v_date_temp = {}
                // v_date_temp[v] = val
                date_format = this.format_epoch(d)

                v_totals[v] += val
                v_total += val;
                
                if (v_dates[date_format] == undefined){
                    v_dates[date_format] = {}
                }            
                if (v_dates[date_format][v] == undefined){
                    v_dates[date_format][v] = 0
                }            
                v_dates[date_format][v] += val

                if (date_formats.toString().indexOf(date_format) == -1) {
                    date_formats.push(date_format)
                }

            }
            // grab all the variants and events by saved dates
            for(var j=0; j < events.length; j++){
                e = events[j];
                e_key = v_key + '/e/' + e
                for(var k=0; k < dates.length; k++){
                    d = dates[k];
                    d_key = e_key + '/' + dates[k]
                    val = this.get_stat_val(d_key)
                    variant_event_name = v + '/' + e
                    date_format = this.format_epoch(d)
                    if (e_totals[variant_event_name]==undefined && val > 0){
                        e_totals[variant_event_name]=0
                    }
                    if(val > 0) {
                        e_totals[variant_event_name] += val
                        c_totals[variant_event_name] = this.conversion_rate(val, v_totals[v])
                        v_events.push(variant_event_name)
                    }
                    e_total += val
                    if (e_dates[date_format] == undefined){
                        e_dates[date_format] = {}
                    }
                    // only add if we have a value (keeps response minimal)
                    if (val>0) e_dates[date_format][variant_event_name] = val
                }
            }
        }
        
        // util.puts('v_totals: ' + util.inspect(v_totals))
        // util.puts('v_dates: ' + util.inspect(v_dates))
        // 
        // util.puts('v_total: ' + v_total)
        // util.puts('---')
        // util.puts('e_totals: ' + util.inspect(e_totals))
        // util.puts('e_dates: ' + util.inspect(e_dates))
        // util.puts('e_total: ' + e_total)
        // util.puts('---')
        // util.puts(util.inspect(date_formats))
        
        
        
        return {
            variant_total:v_total,
            variant_totals:v_totals,
            variant_dates:v_dates,
            variant_events:v_events,
            conversion_totals:c_totals,
            event_total:e_total,
            event_totals:e_totals,
            event_dates:e_dates,
            dates:date_formats,
            variants:this.variants.split(','),
            events:(this.events) ? this.events.split(',') : []
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
        var s_totals={}; // step totals (sum across all variants)
        var sv_totals={}; // step variant totals (for each step/variant)
        var sv_events = []
        var c_totals = {} // conversion totals
        var date_formats = [], date_format;
        
        var event_params = []
        var variant_params = []
        var step_variant, step_variant_event;
        
        for(var i=0; i < dates.length; i++){
            date_formats.push(this.format_epoch(parseInt(dates[i], 10)))
        }
        
        // seperate events from variant keys...
        for(var i=0; i < this.stats.keys.length; i++){
            key=this.stats.keys[i]
            params = {}
            if (event_pattern.test(key)){
                // util.puts('event')
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
                // util.puts(util.inspect(params))
                event_params.push(params)
            } else {
                if (variant_pattern.test(this.stats.keys[i])){
                    // util.puts('variant')
                    // util.puts(util.inspect(variant_pattern.exec(this.stats.keys[i])))
                    parts = variant_pattern.exec(key)
                    params = {
                        site:parts[1],
                        test_name:parts[2],
                        step:parts[3],
                        variant:parts[4],
                        date:this.format_epoch(parseInt(parts[5], 10)),
                        count:this.stats[key]
                    }
                    // util.puts(util.inspect(params))
                    variant_params.push(params)
                }
            }
        }
        for(var i=0; i < variant_params.length; i++){
            param = variant_params[i]
            step_variant = param.step + '/' + param.variant;
            
            if (v_totals[param.variant]==undefined){
                v_totals[param.variant]=0
            }
            v_totals[param.variant] += param.count
            v_total+=param.count
            
            if (v_dates[param.date] == undefined){
                v_dates[param.date] = {}
            }            
            
            v_date = v_dates[param.date];
            v_date[step_variant] = param.count;
            v_dates[param.date] = v_date

            if (s_totals[param.step] == undefined){
                s_totals[param.step] = 0
            }            
            s_totals[param.step] += param.count

            if (sv_totals[step_variant] == undefined){
                sv_totals[step_variant] = 0
            }            
            sv_totals[step_variant] += param.count

        }

        for(var i=0; i < event_params.length; i++){
            param = event_params[i];
            step_variant = param.step + '/' + param.variant;
            step_variant_event = param.step + '/' + param.variant + '/' + param.event_name;
            if (e_totals[step_variant_event] == undefined) {
                e_totals[step_variant_event] = 0
            }
            e_totals[step_variant_event] += param.count
            e_total += param.count
            if (e_dates[param.date] == undefined){
                e_dates[param.date] = {}
            }
            e_date = e_dates[param.date];
            e_date[step_variant_event] = param.count;
            e_dates[param.date] = e_date
            
            c_totals[step_variant_event] = this.conversion_rate(param.count, sv_totals[step_variant])
            sv_events.push(step_variant_event)
        }
        
        return {
            variant_total:v_total,
            variant_totals:v_totals,
            variant_dates:v_dates,
            step_totals:s_totals,
            step_variant_totals:sv_totals,
            step_variant_events:sv_events,
            conversion_totals:c_totals,
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


