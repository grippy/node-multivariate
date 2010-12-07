# Still in development...

I figured I should check this in before anything happens to the code... 
Right now, there is no admin to create the tests and easily see the stats.
Still working on this piece. Application errors aren't being handled completely. I also have a demo application to show how all this works.

# Description:

This simple testing framework hopes to make a/b or multivariate webpage testing manageable.
It also allows for event tracking and bucket tracking.
See below for a description of the different testing types and how to integrate them.

# Testing Types

	- Bucket: A bucket test is used for tracking well, buckets. You could use it track pageviews, how many times completed a certain action, etc. You can track these on either the client or the server.
	- Module: A module test swtiches out a portion of a webpage. It's purely client-side. A module test also allows for tracking events an associating them with the corresponding variant.
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

# Load the sample data

'test/fixtures.js' contains sample test data. To load them in your development environment:

	'node scripts/load_fixtures.js'

# Stats

All tests aggregate by date the variant and event totals. In addition, funnel tests also aggregate the step numbers, too.

# Testing the application

To run the test suite, fire up 'node test/runner.js'. This will attempt to connect to your local redis server and select db 15 for running the tests. 

# Starting the application

'node script/development.js' - This will autorestart the webserver for each file change. Useful if you plan on working on this application.
'node app.js production' - This is for production mode. The file watcher is turned off here. Memory footprint is really small (somewhere around 8MB)



# Client Javascript

The application requires using the client-side javascript api if you care about module tests and/or event/bucket tracking. 
Keep in mind, that you'll need to place the script tag in the page head tag for the cookie tracking to work properly.

# Server-Side integration

In order to integrate page or funnel testing, you'll need to make calls to this application from your application controller actions/handlers, etc.
Then you can render the correct page based on the variant value returned from this application.

# Example

Let's run through a quick example of how to configure a page test (no admin exists for this now, so let's do it manually).

1. We want to create a new test identified with the following structure:

	{
		active:true,
		key:'/s/domain.com/p/t/page_test',
		name:'page_test',
		site:'domain.com',
		type:'p',
		variants:'a,b',
		distribution:'80,20',
		dates:'',
		events:'',
		spread:'aaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaabaaaab'
	}

This is a simple a/b test with an 80/20 split. In theory, you could make this a,b,c,d. Until the admin exists you need to figure the spread out manually. Make sure the spread length is equal to 100 characters.

2. Now that we have a page test created... It's time to plug this into your app controller.

For example, say you want to test this page on your site: http://example.com/somepage




