# Still in development...

This is still in development mode (hence no tag exists with a version number). 
It is production ready if you want to try it out.
You can manually load tests right now using the fixtures (see below).

# Description

This simple framework hopes to make a/b or multivariate webpage testing manageable.
It also allows for event and bucket tracking.
See below for a description of the different testing types and how to integrate them.

# Installation

This application has been tested on node 2.x and redis 2.x.

	git clone git://github.com/grippy/node-multivariate.git
	git submodule init
	git submodule update

The only submodule used is redis-node (https://github.com/bnoguchi/redis-node).

# Testing Types

	- Bucket: A bucket test is used for tracking well, buckets. You could use it to track pageviews or how many times an action was completed, etc. You can track these on either the client or the server.
	- Module: A module test swtiches out a portion of a webpage. It's purely client-side. A module test also allows for tracking events and associating them with the corresponding variant.
	- Page: A page test is used to render one version of a webpage or another. Also allows for tracking events from the client. See below for example. 
	- Funnel: A funnel test is nothing more then a series of page tests. The only difference is that the variant is sticky. So, if a user sees variant 'b' for step 1, then they'll see variant 'b' throughout the remaining steps. Also allows for tracking events from the client. 

# Application Config

'config/environment.js' contains three sections you can update (development, testing, and production).

	exports.development = {
	    redis_db:0,
	    redis_host:'127.0.0.1',
	    redis_port:6379,
	    app_port:8000,
	    admin_port:9000
	}

Production also features an additional parameter for spawning a socket slave to serve requests from:

	exports.production = {
	    redis_db:0,
	    redis_host:'127.0.0.1',
	    redis_port:6379,
	    app_port:8000,
		app_slaves:2,
	    admin_port:9000
		
	}

The number of slaves can be equal to: # processor cores * # processors - 1 (main application listening on the port #)

# Load the sample data

'scripts/load.js' features an interactive node app for loading or resetting tests and stats.

In 'fixtures/' are files per environment which contains test data. 

To load them in your development environment:

	'node scripts/load.js'
	
To load them in your production environment:

	'node scripts/load.js production'

From there, you can load the tests by either entering the test number or name to load:

	test_name

This just saves the test metadata with the values from the fixture.

	test_name -r

-r option saves and resets the test along with its stats in redis.

# Testing the application

To run the test suite, fire up:

	'node test/runner.js'

This will attempt to connect to your local redis server and select db 15 for running the tests. 

# Starting the application

This will autorestart the webserver for each file change. Useful if you plan on working on this application.

	'node script/development.js'

This is for production mode. The file watcher is turned off here. The memory footprint is really small (somewhere around 8MB). The production script below also creates a number of socket slaves (actual number defined in config).

	'node script/production.js > log/production.log &'
	
The above command will start a daemon process but it will eventually die with no reason. 
You'll most likely want to start/stop using Upstart and then watch the process with Monit to make it bulletproof.
For examples on how to do this, see 'config/upstart-production.conf' and 'config/monit-production.conf'.

# Stats API

To view the stats for a particular test:

	http://localhost:8000/stats/test/:test_key

All tests aggregate by date the variant and event totals. In addition, funnel tests also aggregate the step numbers, too.

For example, if you want to view the stats from one of the fixtures:

	http://localhost:8000/stats/test/s/domain.com/p/t/page_test

To view the stats for a particular bucket:

	http://localhost:8000/stats/bucket/:bucket_key

(These routes will eventually migrate to the admin app when it's ready.)

# Admin application

The admin application is really sparse at the moment.
It only loads in development mode lists all the possible tests or bucket keys stored in redis.
The stats pages then make a call to the main server api to return the data.

To fire it up:
	
	'node admin/scripts/development.js'

With the default, admin config parameters, you can view it here:

	'http://localhost:9000/admin'

# Client Javascript

The application requires using the client-side javascript api if you care about module tests and/or event/bucket tracking. 
Keep in mind, that you'll need to place the script tag in the page head tag for the cookie tracking to work properly.

# Server-Side integration

In order to integrate page or funnel testing, you'll need to make calls to this application from your application controller actions/handlers, etc.
Then you can render the correct page based on the variant value returned from this application.

# Bot Filtering

Both page and funnel testing allow for the removal of bots from the test flow(s). 
See 'app/crawlers.js' for the list of basic user agent regex expressions.
To filter by user agent, just pass it along with the page or funnel test request.

# Example

Let's run through a quick example of how to configure a page test (no admin exists for this now, so let's do it manually).

We want to create a new test identified with the following structure:

	{
		active:true,
		name:'page_test',
		site:'domain.com',
		type:'p',
		variants:'a,b',
		distribution:'80,20'
	}

This is a simple a/b test with an 80/20 split. In theory, you could make this a,b,c,d. Until the admin exists you need to figure out the spread manually. Make sure the spread length is equal to 100 characters.

For now, modify fixtures/development.js and add another test. You can then run 'scripts/load.js' to load it.

Now that we have a page test created... It's time to plug this into your app controller.

For example, say you want to test this page on your site: http://example.com/somepage

In the corresponding controller (let's say you're using nodejs):

	var multivar = http.createClient(8000, 'localhost');
	var tests = {
	    'page_test':{
	        'url':'/s/domain.com/p/t/page_test'
	    }
	}
	function somepage(req, res){
	    var user_agent = req.headers['user-agent']
	    var request = multivar.request('GET', tests.page_test.url + '?user_agent=' + escape(user_agent), {'host': 'localhost'});
	    request.end();
	    request.on('response', function (response) {
	      response.setEncoding('utf8');
	      response.on('data', function (chunk) {
	        var test = JSON.parse(chunk.toString())
			if (test.variant == 'a'){
				res.write(page_a_template({'test':test}))
			} else {
				res.write(page_b_template({'test':test}))
			}
	        res.end();
	      });
	    });
	}

Markup for /somepage - variant a:

	<html>
		<head>
			<title>Page A</title>
			<script type="text/javascript" src="http://localhost:8000/api/1.0/client.js"></script>
			<script type="text/javascript">
				multivar.base_url = 'http://localhost:8000';
				multivar.site = 'domain.com';
				multivar.page(<%=JSON.stringify(test)%>)
			</script>
		</head>
		<body>
			<h1>Page Animal!</h1>
			<a href="#track" onclick="multivar.track('<%=test.name%>', 'nice')">Nice!</a> | 
			<a href="#track" onclick="multivar.track('<%=test.name%>', 'hell_yeah')">Hell Yeah!</a>
			<br />
			<img src="http://i398.photobucket.com/albums/pp62/michelequintana/muppets-animal.jpg" />
			<br />
			<%=JSON.stringify(test)%>
		</body>
	</html>

# Hosting this application

In the above example, we're serving the multivariate app on localhost:8000. 
You'll probably want to host this on a different domain or sub-domain of your application and proxy the requests.
In addition, also point your webserver to the 'static/' directory so it handles serving the client api.

# Performance
Load testing on localhost varies between 1200-1400rps on average (when tested on a MacBook Pro Core Duo w/ 2GB/667MHz/SDRAM).
Let me know what you discover.
