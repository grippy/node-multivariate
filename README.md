# Still in development...

I figured I should check this in before anything happens to the code... Right now, there is no admin to create the tests and easily see the stats. Still working on this piece. Application errors aren't being handled completely. I also have a demo application to show how all this works.

# Description:

This simple testing framework hopes to make a/b or multivariate testing easy. It also allows for event tracking and bucket tracking. See below for a description of the different testing types and how to integrate them.

# Testing Types

-module:
-module events:
-page:
-page events:
-funnel:
-funnel events
-bucket:

# Application Config

'config/environment.js' contains three sections you can update (development, testing, and production).

	exports.development = {
	    redis_db:0,
	    redis_host:'127.0.0.1',
	    redis_port:6379,
	    app_port:8000,
	    admin_port:9000
	}

# Load the sample data

'test/fixtures.js' contains some sample data if you want to load some empty tests. To load them in your development environment:

	'node scripts/load_fixtures.js'

# Testing the application

To run the test suite, fire up 'node test/runner.js'. This will attempt to connect to your local redis server and select db 15 for running the tests. 

# Starting the application

'node script/development.js' - This will autorestart the webserver for each file change. Useful if you plan on working on this application.
'node app.js production' - This is for production mode. The file watcher is turned off here. Memory footprint is really small (somewhere around 8MB)

# Client Javascript

The application requires using the client-side javascript api if you care about module tests and/or event/bucket tracking.

# Server-Side integration

In order to integrate page or funnel testing, you'll need to make calls to this application from your application controller actions/handlers, etc.


