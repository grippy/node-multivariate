/*
    multivar usage:
    <script type="text/javascript" src="http://localhost:8000/api/1.0/client.js"></script>
    <script type="text/javascript">
        // 0. setup the required base_url and site properties...
        multivar.base_url = 'http://localhost:8000';
        multivar.site = 'domain.com';
        
        // to enable tracking from the client you'll need to properly initialize a module, page, or funnel test:
        // 1. module testing...
            multivar.module('test_key')
        
        // 2. page testing...
            // pass this from your controller into your view so you can initialize the response from the rest call
            multivar.page({"name":"page_test","type":"p","variant":"a"} 
            
        // 3. funnel testing...
            // pass this from your controller into your view so you can initialize the response from the rest call
            multivar.funnel({"name":"funnel_test","type":"f","variant":"a","step":"page_1","next_step":"page_2","state":"{\"name\":\"funnel_test\",\"type\":\"f\",\"variant\":\"a\",\"step\":\"page_1\",\"next_step\":\"page_2\"}"})

        // call one of these below anytime after the test is initialized (above) :
        // 4. variant event tracking...
            // the variant is returned from the module or page test call above; just associate a key with it.
            multivar.track('test_key', 'event_name')
        
            // w/ optional data collection arg
            multivar.track('test_key', 'event_name', {user:name,...})
        
        // 5. bucket tracking (key, value)
            multivar.bucket('bucket_key', 'claimed')

            // w/ optional data collection arg
            multivar.track('bucket_key', 'claimed', {user:name,...})
		</script>
    </script>
*/

var multivar = {
    base_url:null,
    site:null,
    tests:{},
    cookies:{},
    $:function(id){
        return document.getElementById(id)
    },
    script:function(src) {
        var h = document.getElementsByTagName('head')[0];
        var s = document.createElement('script');
        s.setAttribute('type','text/javascript');
        s.setAttribute('src', src);
        h.appendChild(s);
    },
    
    set_cookie:function( name, value, expires ){
        // set time, it's in milliseconds
        name = "multivar_" + name
        var today = new Date(),
            path = '',
            secure = null;
        today.setTime(today.getTime());
        expires = (expires!=undefined)?expires:1 * (1000 * 60 * 60 * 24); // days
        var expires_date = new Date( today.getTime() + (expires) );
        var cookie = name + "=" +escape( value ) +
        ( ( expires ) ? ";expires=" + expires_date.toGMTString() : "" );
        // ( ( path ) ? ";path=" + path : "" ) +
        // ( ( domain ) ? ";domain=" + domain : "" ) +
        // ( ( secure ) ? ";secure" : "" );
        document.cookie = cookie;
    },
    delete_cookie:function(name){
        this.set_cookie(name, null, -1)
    },
    cookie:function(name){
        var multivar_name = 'multivar_'+name;
        var exists = RegExp(multivar_name+'=');
        if (exists.test(document.cookie)){
            var re = RegExp('^' + multivar_name);
            var cookies = document.cookie.split( ';' ), cookie = '';
            var parts;
            for ( i = 0; i < cookies.length; i++ ) {
                cookie=cookies[i].replace(/^\s+|\s+$/g, ''); // remove white space from beg and end
                if (re.test(cookie)){
                    // this.cookies[name]
                    parts = cookie.split('=')
                    return unescape(parts[1])
                }
            }
        }
        return null;
    },
    
    init:function(site){
        this.site = site
    },
    filter:function(s){
        return s.replace(/\//g,'-')
    },
    test_key_url:function(t,k){
        return this.base_url + '/s/' + this.site + '/' + this.filter(t) + '/t/' + this.filter(k);
    },
    test_variant_event_key_url:function(t,k,v,e){
        return this.test_key_url(t,k) + '/v/' + this.filter(v) + '/e/' + this.filter(e);
    },
    test_funnel_variant_event_key_url:function(t,k,s,v,e){
        return this.test_key_url(t,k) + '/step/' + this.filter(s) + '/v/' + this.filter(v) + '/e/' + this.filter(e);
    },

    bucket_key_url:function(k, v){
        return this.base_url + '/s/' + this.site + '/b/' + this.filter(k) + '/' + this.filter(v);
    },
    module:function(key){
        // initial this test...
        // this.tests[key]=null;
        var test_key_url = this.test_key_url('m', key)
        this.script(test_key_url + '?jsonp=multivar.module_cb' )
    },
    module_cb:function(result){
        this.tests[result.name] = result;
        var variant_container = result.name + '_' + result.variant;
        // alert(variant_container)
        var el = this.$(variant_container)
        if (el){
            el.style.display = '';
        }
    },
    page:function(result){
        // initial this test...
        // this.tests[key]=null;
        // var test_key_url = this.test_key_url('p', key)
        // this.script(test_key_url)
        this.tests[result.name] = result;
    },
    funnel:function(result){
        this.tests[result.name] = result;
        if(result.next_step){
            this.set_cookie(result.name, result.state)
        } else {
            this.delete_cookie(result.name)
        }
    },
    track:function(t, e){
        var test = this.tests[t]
        var track_url;
        if (test.type != 'f'){
            track_url = this.test_variant_event_key_url(test.type, t, test.variant, e)
        } else if (test.type == 'f') {
            track_url = this.test_funnel_variant_event_key_url(test.type, t, test.step, test.variant, e)
        }
        var data;
        if(arguments[2]!=undefined){data = this.data_params(arguments[2])}
        if (track_url) {
            if(data) {track_url += '?data=' + data};
            this.script(track_url)
        }
    },
    bucket:function(k, v){
        var data;
        if(arguments[2]!=undefined){
            data = this.data_params(arguments[2])
        }
        var url = this.bucket_key_url(k, v)
        if(data) {url += '?data=' + data};
        this.script(url)
    },
    data_params:function(o){
        var parts = []
        for(var p in o){
            parts.push(p + '=' + o[p])
        }
        if (parts.length) {return escape(parts.join('&'))}
        return null
    },
    end:function(){}
    
}