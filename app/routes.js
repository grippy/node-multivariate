var sys = require('sys')

/* route class */
function Route(name, path){
    content_type = 'text/javascript'
    if (arguments.length){
        if (arguments[2] != undefined){
            content_type = arguments[2];
        }
    }
	this.name = name;
	this.path = path;
	this.tokens = [];
	this.pattern = null;
	this.content_type = content_type;
	this.regify()
	return this;
}
Route.prototype.regify = function(){
	var parts = this.path.split('/'), part, grouping = [];
	for (var i=0; i < parts.length; i++){
		part = parts[i]
		if (part.indexOf(':') == 0) {
		    
		    if (part.indexOf('*') == -1){
    			this.tokens.push(part.replace(':', ''))
    			part = '([a-zA-Z0-9,-.%_~;]*)'
		    } else {
		        // matched a wild card glob...
                this.tokens.push(part.replace(':', '').replace('*', ''))
                part = '([a-zA-Z0-9,-.%_~;\/]*)';
		    }
		    
		}
		grouping.push(part)
	}
	this.pattern = new RegExp("^"+grouping.join('/'))
}
Route.prototype.parse = function(path){
	var grouping = this.pattern.exec(path)
	var params = {};
	for(var i=0; i < this.tokens.length; i++){
		params[this.tokens[i]] = grouping[i + 1]
	}
	return params
}
Route.prototype.to_url = function(){
	// take the arguments and replace tokens
	var token, 
		path = this.path,
		params = (arguments[0] != undefined) ? arguments[0] : {},
		query = [];
	for (var i=0; i < this.tokens.length; i++){
		token = this.tokens[i];
		path = path.replace(':'+ token, params[token])
		params[token] = null;
	}
	var val, kwargs = [];
	for(var prop in params){
		val = params[prop]
		if (val) {
			var a = []
			a.push(prop)
			a.push('=')
			a.push(qs.escape(val.toString()))
			kwargs.push(a.join(''))
		}
	}
	if (kwargs.length > 0) path += '?' + kwargs.join('&');
	return path
}

// expose the Route class
exports.Route = Route;

/*////////////////////////////////////////////////////////////////////////////////*/
/* route helper functions */

// cache for the routes by path...
exports.path_cache = path_cache = {};

// list of routes...
exports.routes = routes = [];

exports.finalize = function(){
	// sort descending
	this.routes.sort(function(a, b){
		return b.path.length - a.path.length;
	})
	// cache the route path by name...
    // var r;
    // for(var i=0; i < this.routes.length; i++){
    //  r = this.routes[i];
    //  this.routes_by_name[r.name] = r
    // }
}

exports.match = function(path){
     // return a route from the specified path..
     var route, params;
         // path = path.replace('.json', '').replace('.js','');

     if (path_cache[path] != undefined){
         // sys.puts('=> Return from path_cache')
         route = path_cache[path];
     } else {
         for (var i=0; i < this.routes.length; i++){
             route = this.routes[i];
             if (route.pattern.test(path)) { 
                // check to make sure root is actually root
                if ((route.path === '/' && path !== '/')){
                     route = null
                }
                break
             } 
             route = null // so we don't end up with a route if nothing matches
         }
     }
     if (route){
         if (path_cache[path] == undefined) {
             path_cache[path] = route;
         }
         return [route].concat(route.parse(path))
     }
     return null;
}