var util = require('util'),
	http = require('http'),
    fs = require('fs'),
    url = require('url'),
    qs = require("querystring"),
    Step = require('../app/step'),
    Template = require('../app/template').Template,
    routes = require('../app/routes'),
    model = require('../models'),
    helper = require('../app/helper').helper;

/*////////////////////////////////////////////////////////////////////////////////*/
/* grab the config */
var config = require('../app/config').init()

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
function puts(s){util.puts(s)}
function inspect(o){puts(util.inspect(o))}
function undef(v){return v === undefined}
function not_undef(v){return !undef(v)}
function watch_files(){
    puts("=> Watching files")
	var watch = require('../app/autoexit').watch;
	watch(__dirname,".js", function(){util.puts('=> File changed. Restarting...')});
	watch(__dirname,".html", function(){util.puts('=> File changed. Restarting...')});
}

// http client
var multivar_server = http.createClient(config.app_port, 'localhost');
function get(url, cb){
    // puts(url)
    var request = multivar_server.request('GET', url, {'host': 'localhost'});
    request.end()
    request.on('response', function(response) {
      response.setEncoding('utf8');
      response.on('data', cb);
    });
}



/*////////////////////////////////////////////////////////////////////////////////*/
/* templates */
var views = {}, partials = {};

var dir = fs.readdirSync('./admin/views'), fd, parts, name, tmpl;
for(var i=0; i < dir.length; i++){
    fd=dir[i]
    // puts(fd)
    parts = fd.split('.')
    name = parts[0]
    tmpl = new Template(name,
                        parts[parts.length-1],
                        fs.readFileSync('admin/views/' + fd).toString())

    if(fd.indexOf('_')!=0){
        views[name] = tmpl;
    } else {
        partials[name] = tmpl;
    }

}

// cache the templates by name
Template.prototype.partials = partials;


/*////////////////////////////////////////////////////////////////////////////////*/
/* handlers */

var dir = fs.readdirSync('./admin/handlers'), fd;
for(var i=0; i < dir.length; i++){
    fd=dir[i]
    if (fd.indexOf('.js') > -1 && fd.indexOf('index.js') == -1){
        eval(fs.readFileSync('admin/handlers/' + fd).toString())
    }
}

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
                if (path == '/favicon.ico') {
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
                    if (route.name == 'root'){
                        root(req, res)
                    } else if (route.name == 'create_test'){
                        // create_test(req, res)
                    } else if (route.name == 'test_stats'){
                        test_stats(req, res, params)
                    } else if (route.name == 'bucket_stats'){
                        bucket_stats(req, res, params)
                    } else if (route.name == 'buckets'){
                        buckets(req, res, params)
                    } else if (route.name == 'data'){
                        data(req, res, params)
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

/*////////////////////////////////////////////////////////////////////////////////*/
/* routes */
routes.routes = [
    new routes.Route('root', '/admin', 'text/html'), // login & cookie
    // new routes.Route('create_test', '/admin/create/test', 'text/html'),
    new routes.Route('test_stats', '/admin/stats/test/:test_key*', 'text/html'), // page, module, or funnel stats by key
    new routes.Route('bucket_stats', '/admin/stats/bucket/:bucket_key*', 'text/html'),
    new routes.Route('buckets', '/admin/buckets/:buckets_key*', 'text/html'),
    new routes.Route('data', '/admin/stats/data/:data_key*', 'text/html'),

    // new routes.Route('data_json', '/admin/data/:data_key/json', 'application/json'),
    // new routes.Route('data_csv', '/admin/data/:data_key/csv', 'application/csv')

]
routes.finalize()

/*////////////////////////////////////////////////////////////////////////////////*/
/* load the static js file */
var client_js = '', favicon='';
if (config.env == 'development') {
    watch_files() /* restart on file change... */
}

/*////////////////////////////////////////////////////////////////////////////////*/
/* local ref to the redis client */
var redis = config.redis

var http_server = http.createServer(function(req, res){
    handler(req, res)
})
http_server.port = config.admin_port
http_server.listen(config.admin_port);
util.puts('=> Server listening on http://127.0.0.1:'+ http_server.port +' (pid:' + process.pid +')')

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});
