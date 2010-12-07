/*
    usage: 
    <script type="text/javascript" src="http://localhost:8000/api/1.0/client.js"></script>
    <script type="text/javascript">
        multivar.init('http://localhost:8000', 'site_key')
        // 1. module testing...
        multivar.module('test_key')

        // 2. page testing...
        multivar.page('test_key')
        
        // 3. variant event tracking...
        // the variant is returned from the module or page test call above
        multivar.track('test_key', 'event_name')
    
        // 4. bucket tracking (key, value)
        multivar.bucket('listing_page', 'claimed|unclaimed')
    
    </script>

*/

// if(!this.JSON){this.JSON={}}(function(){function f(n){return n<10?"0"+n:n}if(typeof Date.prototype.toJSON!=="function"){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf()}}var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==="string"?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+string+'"'}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==="object"&&typeof value.toJSON==="function"){value=value.toJSON(key)}if(typeof rep==="function"){value=rep.call(holder,key,value)}switch(typeof value){case"string":return quote(value);case"number":return isFinite(value)?String(value):"null";case"boolean":case"null":return String(value);case"object":if(!value){return"null"}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==="[object Array]"){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||"null"}v=partial.length===0?"[]":gap?"[\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"]":"["+partial.join(",")+"]";gap=mind;return v}if(rep&&typeof rep==="object"){length=rep.length;for(i=0;i<length;i+=1){k=rep[i];if(typeof k==="string"){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}else{for(k in value){if(Object.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}v=partial.length===0?"{}":gap?"{\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"}":"{"+partial.join(",")+"}";gap=mind;return v}}if(typeof JSON.stringify!=="function"){JSON.stringify=function(value,replacer,space){var i;gap="";indent="";if(typeof space==="number"){for(i=0;i<space;i+=1){indent+=" "}}else{if(typeof space==="string"){indent=space}}rep=replacer;if(replacer&&typeof replacer!=="function"&&(typeof replacer!=="object"||typeof replacer.length!=="number")){throw new Error("JSON.stringify")}return str("",{"":value})}}if(typeof JSON.parse!=="function"){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==="object"){for(k in value){if(Object.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v}else{delete value[k]}}}}return reviver.call(holder,key,value)}text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){j=eval("("+text+")");return typeof reviver==="function"?walk({"":j},""):j}throw new SyntaxError("JSON.parse")}}}());
/*
function days(n){
    return n * (1000 * 60 * 60 * 24)
}
function hours(n){
    return n * (1000 * 60 * 60)
}
function minutes(n){
    return n * (1000 * 60)
}
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
    test_key_url:function(t,k){
        return this.base_url + '/s/' + this.site + '/' + t + '/t/' + k;
    },
    test_variant_event_key_url:function(t,k,v,e){
        return this.test_key_url(t,k) + '/v/' + v + '/e/' + e;
    },
    test_funnel_variant_event_key_url:function(t,k,s,v,e){
        return this.test_key_url(t,k) + '/step/' + s + '/v/' + v + '/e/' + e;
    },

    bucket_key_url:function(k, v){
        return this.base_url + '/s/' + this.site + '/b/' + k + '/' + v;
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
        if (track_url) {
            this.script(track_url)
        }
    },
    bucket:function(k, v){
        this.script(this.bucket_key_url(k, v))
    },
    end:function(){}
    
}