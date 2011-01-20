var sys = require("sys"),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    qs = require("querystring"),
    Step = require('./app/step'),
    routes = require('./app/routes'),
    model = require('./models'),
    crawler = require('./app/crawlers').crawler,
    helper = require('./app/helper').helper;

/*////////////////////////////////////////////////////////////////////////////////*/
/* helper functions */
Date.prototype.log_format = function(){
    var month = ((this.getMonth() + 1) > 9) ? (this.getMonth() + 1).toString() : '0' + (this.getMonth() + 1).toString()
    var date = ((this.getDate() > 9) ? this.getDate().toString() : '0' + this.getDate().toString())
    return '[' + this.getFullYear().toString() + '/' + month + '/' + date +
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
	watch(__dirname,".js", function(){sys.puts('=> File changed. Restarting...')});
}
/*////////////////////////////////////////////////////////////////////////////////*/
/* app cache */
var test_cache = {}
var bucket_members_cache = {}

/*////////////////////////////////////////////////////////////////////////////////*/
/* load handlers */

/* 
    Don't use the common js pattern for loading the handlers... 
    Treat the handlers more like virtual includes.
    Keeps them clean and dry this way...
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
        // save the date...
        req.date = new Date();
        
        // create a few response methods...
        res._body = [];
        res.header = {'Cache-Control':'no-store'};
        res.status_code = 200;
        res.body = function(s){
            this._body.push(s);
        }
        req.addListener('data', function(chunk){})
        req.addListener('end', function(){
            try{        
                var uri = url.parse(req.url),
                    path = uri.pathname,
                    params = (uri.query != undefined) ? qs.parse(uri.query) : {};
                    
                // heartbeat for production...
                if (path == '/heartbeat'){
                    res.header['Content-Type'] = 'text/html'
                    res.body('')
                    end(req, res)
                }
                // static hook for the client api when no web server is used
                // this is only loaded in dev mode...
                if (path == '/api/1.0/client.js'){
                    res.header['Content-Type'] = 'text/javascript'
                    res.body(client_js)
                    end(req, res)
                } else if (path == '/favicon.ico') {
                    res.header['Content-Type'] = 'image/vnd.microsoft.icon'
                    res.body('')
                    end(req, res)
                }
                // otherwise this is a route request....
                var route = routes.match(path);
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
                            track(req, res, path, params)
                
                        } else {
                            // we have a route here...
                            module_test(req, res, path, params)
                        }
        
                    } else if (route.name == 'site_page_test'){
                        if (helper.has_variant(path) && helper.has_event(path)) {
                            // check to see if this test is a var or event
                            track(req, res, path, params)
                        } else {
                            page_test(req, res, path, params)
                        }

                    } else if (route.name == 'site_funnel_test'){
                        if (helper.has_variant(path) && helper.has_event(path)) {
                            // check to see if this test is a var or event
                            track(req, res, path, params)
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
                    } else if (route.name == 'data_stats'){
                        data_stats(req, res, params)
                    } else {
                        res.body('undefined route')
                        end(req, res)
                    }
                } 
            } catch(e){
                res.status_code = 500
                end(req, res)
                puts('////////////////')
                puts(res.status_code)
                puts(req.method + ' ' + req.url)
                inspect(req.headers)
                puts('')
                puts(e.stack)
                puts('////////////////')
            }
        })
}

// expose the handler for good times..
exports.handler = handler;

/*////////////////////////////////////////////////////////////////////////////////*/


/*////////////////////////////////////////////////////////////////////////////////*/
/* load the static js file */
var client_js = '', favicon='';

/* grab the config */
var config = require('./app/config').init()

// puts("=> Starting application in " + config.env + " mode")

/*////////////////////////////////////////////////////////////////////////////////*/
/* local ref to the redis client */
var redis = config.redis

/*////////////////////////////////////////////////////////////////////////////////*/
// routes... eat the meat and lick the gravy.
routes.routes = [
    new routes.Route('root', '/'),
    new routes.Route('create_test', '/create/test'),
    new routes.Route('test_stats', '/stats/test/:test_key*'),
    new routes.Route('bucket_stats', '/stats/bucket/s/:site/b/:name'),
    new routes.Route('data_stats', '/stats/data/:data_key*'),
    new routes.Route('site_bucket', '/s/:site/b/:name/:value'),
    new routes.Route('site_page_test', '/s/:site/p/t/:name'),
    new routes.Route('site_module_test', '/s/:site/m/t/:name'),
    new routes.Route('site_funnel_test', '/s/:site/f/t/:name')
]
routes.finalize()

/*////////////////////////////////////////////////////////////////////////////////*/
/* start the server only if development mode */
/* development mode uses a file watcher to restart on changes this makes it way easier if we can start an app here */ 
if (config.env == 'development') {

    /* restart on file change... */
    watch_files()
    client_js = fs.readFileSync("static/api/1.0/client.js").toString();
}

if (config.env == 'development' || config.env == 'testing'){
    var http_server = http.createServer(function(req, res){
        handler(req, res)
    })
    
    http_server.port = config.app_port
    http_server.listen(config.app_port);
    sys.puts('=> Server listening on http://127.0.0.1:'+ http_server.port +' (pid:' + process.pid +')')
}