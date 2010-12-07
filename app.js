var sys = require("sys"),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    qs = require("querystring"),
    Step = require('./app/step'),
    model = require('./models'),
    crawler = require('./app/crawlers').crawler,
    helper = require('./app/helper').helper

/*////////////////////////////////////////////////////////////////////////////////*/
/* helper functions */
Date.prototype.log_format = function(){
    return '[' + this.getFullYear().toString() + '/' + (this.getMonth() + 1).toString() + '/' + ((this.getDate() > 9) ? this.getDate().toString() : '0' + this.getDate().toString()) +
            ' ' + this.getHours().toString() + ':' + this.getMinutes() + ':' + this.getSeconds() + '.' + this.getMilliseconds() + ']'
}
Array.prototype.contains = function(v){
    for(var i=0; i < this.length; i++){
        if(this[i] == v){
            return true;
        }
    }
    return false;
}
function puts(s){sys.puts(s)}
function inspect(o){puts(sys.inspect(o))}
function undef(v){return v === undefined}
function not_undef(v){return !undef(v)}
function watch_files(){
    puts("=> Watching files") 
	var watch = require('./app/autoexit').watch;
	watch(__dirname,".js", function(){sys.puts('File changed. Restarting...')});
}
/*////////////////////////////////////////////////////////////////////////////////*/
/* route class */
function Route(name, path){
	this.name = name;
	this.path = path;
	this.tokens = [];
	this.pattern = null;
	this.content_type = 'text/javascript';
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
/*////////////////////////////////////////////////////////////////////////////////*/
/* route helper functions */
function setup_routes(){
	// sort descending
	routes.sort(function(a, b){
		return b.path.length - a.path.length;
	})
	// cache the route path by name...
    // var r;
    // for(var i=0; i < this.routes.length; i++){
    //  r = this.routes[i];
    //  this.routes_by_name[r.name] = r
    // }
}
function route_match(path){
     // return a route from the specified path..
     var route, 
         params,
         path = path.replace('.json', '').replace('.js','');
     if (route_path_cache[path] != undefined){
         // puts('=> Retrn from route_path_cache')
         route = route_path_cache[path];
     } else {
         for (var i=0; i < routes.length; i++){
             route = routes[i];
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
         if (route_path_cache[path] == undefined) {
             route_path_cache[path] = route;
         }
         return [route].concat(route.parse(path))
     }
     return null;
}


/*////////////////////////////////////////////////////////////////////////////////*/
/* app cache */
var route_path_cache = {}
var test_cache = {}
var bucket_members_cache = {}

/*////////////////////////////////////////////////////////////////////////////////*/
/* load handlers */

/* 
    Don't use the common js pattern for loading the handlers... 
    Treat the handlers more like a virtual include.
    Keeps them clean and dry this way
*/
var dir = fs.readdirSync('./handlers'), fd;
for(var i=0; i < dir.length; i++){
    fd=dir[i]
    if (fd.indexOf('.js') > -1 && fd.indexOf('index.js') == -1){
        eval(fs.readFileSync('handlers/' + fd).toString())
    }
}


/*////////////////////////////////////////////////////////////////////////////////*/
/* main handler */

function handler(req, res){
    req.date = new Date();
    
    // create a few res methods...
    res._body = [];
    res.header = {'Cache-Control':'no-store'};
    res.status_code = 200;
    res.body = function(s){
        this._body.push(s);
    }
    req.addListener('data', function(chunk){})
    req.addListener('end', function(){
        
        var uri = url.parse(req.url),
            path = uri.pathname,
            params = (uri.query != undefined) ? qs.parse(uri.query) : {};
        
        // static hook for the client api when no web server is used
        if (path == '/api/1.0/client.js'){
            res.header['Content-Type'] = 'text/javascript'
            res.body(client_js)
            end(req, res)
        }
        // otherwise this is a route request....
        var route = route_match(path);
        if (route) {
            var route_params = route[1];
            route = route[0];
            
            // merge the route params w/ the query params
            for(var prop in route_params) {
            	var val = route_params[prop];
            	if (params[prop] === undefined) {
                    params[prop] = val
            	}
            }
            
            // set the content-header...
            res.header['Content-Type'] = route.content_type
            
            if (route.name == 'site_module_test'){
                if (helper.has_variant(path) && helper.has_event(path)) {
                    // we have a key route here...
                    // check to see if this test is a var or event
                    track(req, res, path)
                    
                } else {
                    // we have a test route here...
                    // sys.puts('=> Look up and return the test metadata')
                    module_test(req, res, path, params)
                }
            
            } else if (route.name == 'site_page_test'){
                if (helper.has_variant(path) && helper.has_event(path)) {
                    // check to see if this test is a var or event
                    track(req, res, path)
                } else {
                    page_test(req, res, path, params)
                }

            } else if (route.name == 'site_funnel_test'){
                if (helper.has_variant(path) && helper.has_event(path)) {
                    // check to see if this test is a var or event
                    track(req, res, path)
                } else {
                    // we have a test route here...
                    funnel_test(req, res, path, params)
                }
            } else if (route.name == 'site_bucket'){
                track_bucket_value(req, res, path, params)
            } else if (route.name == 'create_test'){
                create_test(req, res)
            } else if (route.name == 'test_stats'){
                test_stats(req, res, params)
            } else if (route.name == 'bucket_stats'){
                bucket_stats(req, res, params)
            } else {
                res.body('undefined route')
                end(req, res)
            }
        } 
        
    })
}

// expose the handler for good times..
exports.handler = handler;


/*////////////////////////////////////////////////////////////////////////////////*/
/* grab the config */
var config = require('./app/config').init()
puts("=> Starting application in " + config.env + " mode")

/* load the static js file */
// clean this up so we don't load in production
var client_js = fs.readFileSync("static/api/1.0/client.js").toString();

/* restart on file change... */
if (config.env == 'development') {watch_files()}

/* local ref to the redis client */
var redis = config.redis

// eat the meat and lick the gravy.
var routes = [
    new Route('root', '/'),
    new Route('create_test', '/create/test'),
    new Route('test_stats', '/stats/test/:test_key*'),
    new Route('bucket_stats', '/stats/bucket/s/:site/b/:name'),
    new Route('site_bucket', '/s/:site/b/:name/:value'),
    new Route('site_page_test', '/s/:site/p/t/:name'),
    new Route('site_module_test', '/s/:site/m/t/:name'),
    new Route('site_funnel_test', '/s/:site/f/t/:name')

]
setup_routes()

var server = http.createServer(function(req, res){
    handler(req, res)
})
server.listen(config.app_port);
sys.puts('=> Server listening on http://127.0.0.1:'+ config.app_port +' (pid:' + process.pid +')')