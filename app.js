/*jslint browser: true, devel: true, node: true, debug: true, todo: true, indent: 2, maxlen: 150, unparam: true*/
/*global require, module, mode*/

(function () {
  'use strict';

  /**
   *---------------------------------------------------------
   * app.js
   *---------------------------------------------------------
   *
   * Sample Web Application implemented in NodeJS.
   *
   * Illustrates what a Developer typically needs to do to
   * use AT&T WebRTC JS SDK to add Telephony and add real-time
   * Call and Conference Management functions into a Web
   * Application.
   *
   *----------------
   * Pre-requisites:
   *----------------
   * Before starting work on your Web Application, it is assumed
   * that, you previously:
   *
   * a) Created an app on AT&T Developer Portal with:
   *
   * WEBRTCMOBILE scope ( 'AT&T Mobile Number' feature)
   * and/or
   * WEBRTC scope ( 'Virtual Number' and 'Account ID' features)
   *
   * b) Configured the resulting App Key, App Secret, Virtual
   * numbers etc. in the package.json
   *
   *
   *-----------------------------
   * This Sample App illustrates:
   *-----------------------------
   *
   *---------------------------------------------
   * 1) Setting up /oauth routes in your web-tier
   *---------------------------------------------
   * to handle User Consent if your application's
   * end user is an AT&T Mobility Subscriber. (aka 'AT&T
   * Mobile Number') feature
   *
   * NOTE:
   *------
   * This set up is needed ONLY IF you plan to use 'AT&T
   * Mobile Number' feature in your Web Application. You
   * can skip it if you plan to use only 'Virtual Number' and
   * 'Account ID' features.
   *
   * Following 2 routes are set up:
   * a) /oauth/authorize
   * b) /oauth/callback
   * c) /oauth/token
   * d) /e911id
   *
   * You can use the file ./routes/att.js as-is out-of-the-box.
   *
   *---------------------------------------------------------
   * @author Raj Sesetti, AT&T Developer Program, DRT/LTA
   *---------------------------------------------------------
   */

// ---------------------------------------------
// Boiler-plate Express App 'require' statements
// ---------------------------------------------
//
  var express = require('express'),
    fs = require('fs'),
    http = require('http'),
    https = require('https'),
    favicon = require('static-favicon'),
    bodyParser = require('body-parser'),
    M2X = require("m2x"),
	request = require('request'),
// ---------------------------------------------
// END: Boiler-plate 'require' statements
// ---------------------------------------------

    app,
    dhs,
    httpsServer,
    httpServer,
    pkg,
    http_port,
    https_port,
    cert_file,
    key_file,
    privateKey,
    certificate,
    api_env,
    app_key,
    app_secret,
    oauth_callback,
    virtual_numbers_pool,
    ewebrtc_domain,
    env_config,
    is_heroku_env;

//--------------------------------------------------------
// SECTION: Initialize configuration
//--------------------------------------------------------
// Following are calculated after required configuration
// entries are read or defaulted.
//
//--------------------------------------------------------
  pkg = require('./package.json');


  is_heroku_env = process.env.NODE_HOME && process.env.NODE_HOME.indexOf('heroku') !== -1;

  if (is_heroku_env) {

    http_port = process.env.PORT;
    console.info('Using HTTP PORT ', http_port);

  } else {

    http_port = process.env.HTTP_PORT || pkg.http_port;
    console.info('Using HTTP PORT ', http_port);

    https_port = process.env.HTTPS_PORT || pkg.https_port;
    console.info('Using HTTPS PORT ', https_port);

  }

  //TODO why do we need SSL certificate
  cert_file = process.env.CERT_FILE || pkg.cert_file;
  key_file = process.env.KEY_FILE || pkg.key_file;
  console.info('Using SSL Configuration - Certificate: ', cert_file, 'Key File: ', key_file);

  //TODO what is argv[2] how is it supplied to node
  api_env = process.argv[2] || process.env.API_ENV || pkg.default_api_env;
  console.info('Using API Env : ', api_env);

  env_config = pkg[api_env];
  env_config.api_env = api_env;
  env_config.host = '45.33.29.206';
  env_config.port = https_port;

  app_key = env_config.app_key;
  app_secret = env_config.app_secret;
  oauth_callback = env_config.oauth_callback;
  virtual_numbers_pool = env_config.virtual_numbers_pool;
  ewebrtc_domain = env_config.ewebrtc_domain;
  
  
  
  const sms_api_key = "jxox2hatkkyz76yzllx8uv5eamy9uc6v";
  const sms_api_secret = "z9xse4dvlbs6ujvyh0pwu2tvbqnj7pbv";
  const sms_oauth_endpoint = "https://api.att.com/oauth/token";
  const sms_endpoint = "https://api.att.com/sms/v3/messaging/outbox";



  if (!app_key || !app_secret) {
    console.error('Insufficient App Configuration');
    console.error('Entries app_key, app_secret are mandatory');
    console.error('Exiting...');
    process.exit(1);
  }

  if ('YourAppKey' === app_key || 'YourAppSecret' === app_secret) {
    console.error('Invalid app_key or app_secret');
    console.error('Entries app_key or app_secret are not set');
    console.error('Exiting...');
    process.exit(1);
  }

  console.info('#####################################################');
  console.info('        Using App Key: ', app_key);
  console.info('     Using App Secret: ', app_secret);
  console.info('#####################################################');

  if (oauth_callback) {
    console.info('OAuth Callback URL: ', oauth_callback);
  } else {
    console.info('OAuth callback is NOT configured. You can not use mobile numbers');
  }
  console.info('#####################################################');

  if (virtual_numbers_pool) {
    console.info('Using Virtual Number Pool:');
    console.info(virtual_numbers_pool);
  } else {
    console.info('Virtual numbers pool is NOT configured. You can not user virtual numbers');
  }
  console.info('#####################################################');

  if (ewebrtc_domain) {
    console.info('EWebRTC domain:');
    console.info(ewebrtc_domain);
  } else {
    console.info('EWebRTC domain is NOT configured.');
  }
  console.info('#####################################################');

//--------------------------------------------------------
// END SECTION: Initialize configuration
//--------------------------------------------------------


//--------------------------------------------------------
// SECTION: start of action
//--------------------------------------------------------
// Configuration is all ready. We are good to go.
//
//--------------------------------------------------------

// Handle this process just in case...
// so that the Log strems are not corrupted
//
  process.on('SIGUSR2', function () {
    console.info('Pending Work items can be killed or stopped');
    console.info('Signal SIGUSR2 received. Reopening log streams...');
  });

// ---------------------------------------------
// BEGIN: Boiler-plate Express app set-up
// ---------------------------------------------
//
  /*jslint stupid: true*/
  privateKey = fs.readFileSync('sample.key', 'utf8');
  certificate = fs.readFileSync('sample.cert', 'utf8');
  /*jslint stupid: false*/

  app = express();

//View Engine setup (Hogan.js)

  /*jslint nomen: true*/
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hjs');
  app.engine('html', require('ejs').renderFile);
  
 /*jslint nomen: false*/

// Middleware

  /*jslint nomen: true*/
  app.use(favicon());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: false}));

  //Checks all routs in the pubic folder
  app.use('/', express.static(__dirname + '/public'));
  
  
  app.get('/call/:rand', /* @callback */ function(req, res){
  	res.render('login_stable.html',{randNo:req.params.rand});
  });
  
  app.get('/main/:name', function(req, res){  
	res.render('main.html');
  });
  
   app.get('/m2x/drone', /* @callback */ function(req, res){
	res.render('drone.html');
  });
  
  app.get('/m2x/:dev_name/dispatcher', /* @callback */ function(req, res){
	res.render('index_disp.html', {dev_namename:req.params.dev_name, resp_name:req.params.resp_name});
  });
  
  app.get('/m2x/:dev_name/:resp_name', /* @callback */ function(req, res){
	res.render('index.html', {dev_namename:req.params.dev_name, resp_name:req.params.resp_name});
  });
   
  app.get('/rtc/:name', /* @callback */ function(req, res){
	res.render('rtc.html');
  });
  

  
  app.post('/m2xOnChange', function(req, res){
	
		res.send("200 OK");
		console.log("================== RECEIVED UPDATE  ===============");
		console.log(req.body);
		
		ar_trigger_Cnt[req.body.device.name]++; 
		
		console.log(JSON.stringify(userDetails));
		
		userDetails.user.forEach(function (eachClient)
		{		
			console.log("UPDATE CHART : " + eachClient.name );
			client_Sockets[eachClient.name].emit('updateChart', {"deviceName":req.body.device.name, "count": ar_trigger_Cnt[req.body.device.name]});
		});
			//client_Sockets['dispatcher'].emit('updateChart', {"deviceName":req.body.device.name, "count": ar_trigger_Cnt[req.body.device.name]});	
			console.log("UPDATE CHART : " + 'dispatcher');
		//client_Sockets[eachClient.name].emit('updateChart_cnt', req.body.device.name);
	 
	});
  
  app.post('/m2xUpdates', function(req, res){
		
			res.send("200 OK");
			console.log("================== RECEIVED TRIGGER  ===============");
			console.log(req.body);
			
			triggerUpdates[req.body.device.name]++;
			
			console.log("TRIGGER OF TYPE : " + req.body.trigger + " RECEIVED ");
			
			var trigger_clnt_Info = {"userObj": userDetails, "trgObj": req.body};
			
			if(req.body.trigger=='Text')
			{
				var name = stream_Info[req.body.device.id].streams[0].name; 		
				console.log("TIME STAMP : " + req.body.timestamp.split("T")[0] + " VALUE : " + req.body.values[name].value);				
				triggerList[req.body.device.name].push({"time":req.body.timestamp.split('T')[0], "severity":"Normal", "value":req.body.values[name].value});						

			}
			if(req.body.trigger=="PTT")
			{
				var name = stream_Info[req.body.device.id].streams[0].name; 		
				console.log("TIME STAMP : " + req.body.timestamp.split("T")[0] + " VALUE : " + req.body.values[name].value);				
				triggerList[req.body.device.name].push({"time":req.body.timestamp.split('T')[0], "severity":"Minor", "value":req.body.values[name].value});						
				
			}
			if(req.body.trigger=="PTX")
				{
				var name = stream_Info[req.body.device.id].streams[0].name; 		
				console.log("TIME STAMP : " + req.body.timestamp.split("T")[0] + " VALUE : " + req.body.values[name].value);			
				triggerList[req.body.device.name].push({"time":req.body.timestamp.split('T')[0], "severity":"Major", "value":req.body.values[name].value});						
			}
			if(req.body.trigger=="Video")
			{
				var name = stream_Info[req.body.device.id].streams[0].name; 		
				console.log("TIME STAMP : " + req.body.timestamp.split("T")[0] + " VALUE : " + req.body.values[name].value);				
				triggerList[req.body.device.name].push({"time":req.body.timestamp.split('T')[0], "severity":"Critical", "value":req.body.values[name].value});						
			}
			if(req.body.trigger=="Drone")
			{
				var name = stream_Info[req.body.device.id].streams[0].name; 		
				console.log("TIME STAMP : " + req.body.timestamp.split("T")[0] + " VALUE : " + req.body.values[name].value);			
				triggerList[req.body.device.name].push({"time":req.body.timestamp.split('T')[0], "severity":"Catastrophe", "value":req.body.values[name].value});						
			} 
			console.log("TRIGGERS LIST OF : " + req.body.device.name + " : " + triggerList[req.body.device.name]); 
			
			console.log(" ******************** ");
			console.log("DISPATCHER : " + client_Sockets['dispatcher'].id);
			console.log(" ******************** ");
			
			client_Sockets["dispatcher"].emit('rcvTrigger', trigger_clnt_Info);
			
			userDetails.user.forEach(function (eachClient)
			{		
				if(eachClient.name!="dispatcher")
				{
					console.log("TRIGGER FROM M2X : " + eachClient.name );	
					client_Sockets[eachClient.name].emit('clntrcvTrigger', trigger_clnt_Info);
				}
							
			});
			

  });
  
  app.get('/openGoApp', function(req, res){
	res.send("200 OK");
	res.render('opengo.html');
  });

	
 app.get('/test', function(req, res){
	res.render('test.html');
  });
  
  
   app.post('/openGo', function(req, res){
	
	res.send("200 OK");
	console.log(req.body);
	client_Sockets['dispatcher'].emit('openGoApp', {msg:'open the app', obj:req.body}); 
		
  });
  
  
  app.get('/sendsms/:number/:str', function (req, res){
		
		console.log(req.params.number + "	" + req.params.str);
		
		   request({
      				  url: sms_oauth_endpoint,
        			  method: "POST",
       				  headers: { "Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        			  body: "grant_type=client_credentials&client_id=" + sms_api_key + "&client_secret=" + sms_api_secret + "&scope=SMS"
			    } ,
   					 function (error, response, body){
				        request({
           			        url: sms_endpoint,
				                  method: "POST",
				                  headers: { "Authorization": "Bearer " + JSON.parse(body).access_token, "Content-Type": "application/x-www-form-urlencoded" },
           			        body: "address=" + encodeURIComponent("tel:"+req.params.number) + "&message=" + encodeURIComponent(req.params.str)
       				         	} , function (error, response, body){
       				         			res.write(' SMS SENT SUCCESSFULLY ');
      				     		});
    	     });
				
	});
			
			
			

  app.get('/callTest/:orig/:term', /* @callback */ function(req, res){
  	res.render('logintest.html',{orig:req.params.orig, term:req.params.term});
  });
  
  app.get('/call/:orig', /* @callback */ function(req, res){
  	res.render('login_saketh.html',{orig:req.params.orig});
  });
  
/*jslint nomen: false*/

// ---------------------------------------------
// END: Boiler-plate Express app set-up
// ---------------------------------------------

// ---------------------------------------------
// BEGIN: CUSTOM CODE for WebRTC functionality
// ---------------------------------------------
// This is the meat of code to enable AT&T WebRTC
//
// ---------------------------------------------
// CUSTOM CODE to enable 'AT&T Mobile Number'
// ---------------------------------------------
// OAuth Routes need for AT&T Authorization if
// you are planning for AT&T Mobility Subscribers
// to use your App. This is also known as
// 'AT&T Mobile Number' feature of AT&T Enhanced WebRTC API
//
// You don't need to include the following 5 lines
// if you don't use that feature
//
  dhs = require('att-dhs');
// Configure the server with environment configuration
// before it can be used

  dhs.configure(env_config);

  dhs.use('router', {
    server: app
  });

// ---------------------------------------------
// END: CUSTOM CODE for 'AT&T Mobile Number'
// ---------------------------------------------

// ---------------------------------------------
// BEGIN: Boiler-plate Express app route set-up
// ---------------------------------------------
// Business as usual from below
//
// catch 404 and forward to error handler
//
  app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

// DEV error handler
// No stacktraces shown to end user.
//
  if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err
      });
    });
  }

// PROD error handler
// No stacktraces shown to end user.
//
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {}
    });
  });

//
// Create web servers - HTTP and HTTPS
//
  httpServer = http.createServer(app).listen(http_port, env_config.host, function () {
    var self;

    console.log('HTTP web server listening on port ' + http_port);

    self = this;
    dhs.use('websocket.eventchannel', {
      server: self
    });
  });


  if (!is_heroku_env) {
    httpsServer = https.createServer({
      key: privateKey,
      cert: certificate
    }, app).listen(https_port, function () {

      console.log('HTTPS web server listening on port ' + https_port);
    });
  }

    var io=require('socket.io')(httpsServer);
    var client_Sockets=[]; 
    var device_Info={}; 
	var device_Id_Info = [];
	var stream_Info=[];
	var ar_trigger_Cnt=[];
	var triggerUpdates=[]; 
	var triggerList=[]; 


	var stats_Info_min={};
	var stats_Info_max={};
	var stats_Info_avg={};
	var userNamePool= ["Bob","Alice"];
	var userDetails = {"user": [{"name":"Bob", "SMS_Number":"14255334696", "PTT_Number_O":"12547840701", "PTT_Number_T":"12547840702", "PTT_Number_Disp":"12547840703", "WebRTC_Number_O":"vtn:9726194369", "WebRTC_Number_T":"19726194370"}, {"name":"Alice", "SMS_Number":"14255334619", "PTT_Number_O":"12547840702", "PTT_Number_T":"12547840701", "PTT_Number_Disp":"12547840703","WebRTC_Number_O":"vtn:9726194369", "WebRTC_Number_T":"19726194370"}, {"name":"dispatcher", "SMS_Number":"17036236352", "PTT_Number_O":"12547840703", "PTT_Number_Alice":"12547840702", "PTT_Number_Bob":"12547840701", "WebRTC_Number_O":"vtn:9726194370", "WebRTC_Number_T":"19726194369"}]}
	var dispatchDetails = {"name":"dispatcher", "SMS_Number":"17036236352", "PTT_Number_O":"12547840703", "PTT_Number_Alice":"12547840702", "PTT_Number_Bob":"12547840701", "WebRTC_Number_O":"vtn:9726194370", "WebRTC_Number_T":"19726194369"};
	var connections=0; 
	var SessionReady_Bob = false;
	var SessionReady_Alice = false;

	var VC_client_sockets=[];
	var PTX_client_sockets=[]; 
	
	
	//"url":"","name":"","status":"","serial":"","tags":"","visibility":"","description":"","created":"","updated":"","last_activity":"","location":"","id":"","key":""};
	
    var m2x = new M2X("786fcfb182b51012063b36440b70ab74");
	
    m2x.devices.list(function(response) {
      
	    console.log(" DEVICE INFO : ");
		console.log(response.json);
		
		response.json.devices.forEach(function(device) {
			
			console.log(" DEVICE NAME : " + device.name);
			
			device_Info[device.name] = device; 			
			device_Id_Info[device.id] = device.name; 
			triggerUpdates[device.name] = 0; 
			triggerList[device.name]=[]; 
			ar_trigger_Cnt[device.name] = 0; 
			
			console.log(device.id);
			m2x.devices.streams(device.id, function (streamInfo)
			{
				console.log("ID : " + streamInfo.json.streams[0].url.split('/')[5]);
				stream_Info[streamInfo.json.streams[0].url.split('/')[5]] = streamInfo.json; 
				//updateStats(streamInfo.json.streams[0].url.split('/')[5], streamInfo.json.streams[0].name);
			});
		
        });
	});
		

	var updateStats = function(id, name)
	{	
			console.log("Updating stats...");
			console.log(" STREAM NAME : " + name + " DEVICE ID : " + id);
			
  		    	console.log("========== MIN ==========");
			    m2x.devices.sampleStreamValues(id, name, {"interval":"86400", "type":"min"}, function(resp)
			    {                                                    
			    	console.log("STATS INFO : " + name)
					console.log(resp.json);                          
					
			    	stats_Info_min[device_Id_Info[id]] = resp.json;                
			    });                                                  
			                                                         
			    console.log("========== MAX ==========");            
			    m2x.devices.sampleStreamValues(id, name, {"interval":"86400", "type":"max"}, function(resp)
			    {                                                    
			    	console.log("STATS INFO : " + name)
					console.log(resp.json);                          
					
			    	stats_Info_max[device_Id_Info[id]] = resp.json;                
			    });                                                  
			                                                         
			    console.log("========== AVG ==========");            
			    m2x.devices.sampleStreamValues(id, name, {"interval":"86400", "type":"avg"}, function(resp)
			    {
			    	console.log("STATS INFO : " + name)
					console.log(resp.json); 
					
			    	stats_Info_avg[device_Id_Info[id]] = resp.json;
			    });
		
	}
	
		
    io.on('connection', function(socket){
		console.log('a user connected');
		connections++; 
		
		socket.on('sessionReady', function (msg)
		{
			console.log(' SESSION READY SENT BY : ' + msg);
			VC_client_sockets[msg]=socket; 
			
			
			
			if(connections%2==0)
			{
				console.log(' BOTH CLIENTS LOGGED IN ');
				
				VC_client_sockets["vtn:9726194369"].emit('makeCall', {"orig":"vtn:9726194370"});
				VC_client_sockets["vtn:9726194370"].emit('makeCall', {"orig":"vtn:9726194370"}); 
				
			}
		});
		
		socket.on('storeInfo', function(msg)
		{
			console.log('STORE INFO: ' + JSON.stringify(msg));
			
				client_Sockets[msg.clnt_name] = socket;
				ar_trigger_Cnt[msg.device_name] = 0; 
				
				console.log(" ******************** ");
				console.log(msg.clnt_name + " : " + client_Sockets[msg.clnt_name].id);
				console.log(" ******************** ");
				
				client_Sockets[msg.clnt_name].emit('storeInfo', msg.clnt_name); 

		});
		
		socket.on('storePTXinfo', function(inp_PTXobj)
		{
			console.log(" STORED PTX " + inp_PTXobj.clnt_name + " SOCKET : " + socket.id );
			client_Sockets[inp_PTXobj.clnt_name] = socket; 
			
			client_Sockets[inp_PTXobj.clnt_name].emit('storePTXinfo', inp_PTXobj.clnt_name); 
		});
		
		socket.on('getDevices', function(msg)		
		{
			
			console.log(" MESSAGE RECEIVED TO GET DEVICES FROM : " + msg);
			console.log(ar_trigger_Cnt);
			socket.emit('showDevices', device_Info, ar_trigger_Cnt); 
			
		});
		
		socket.on('forwardVideo', function(inp_PTX_URLobj)
		{
				console.log(" RECEIVED A Video FROM : " + inp_PTX_URLobj.clnt_name);
				
				userDetails.user.forEach(function (eachClient)
				{		
					console.log(" PTX Socket: " + eachClient.name); 
					if(eachClient.name!=inp_PTX_URLobj.clnt_name)
					{
						console.log(" FORWARDED VIDEO TO : " + eachClient.name + " : " + client_Sockets[eachClient.name].id); 						
						client_Sockets[eachClient.name].emit('playVideo', inp_PTX_URLobj.dataURL);
					}
				});
				
				//client_Sockets['dispatcher'].emit('playVideo', inp_PTX_URLobj.dataURL);
			
		});
		
		
		socket.on('forwardPhoto', function(inp_PTX_URLobj)
		{
				console.log(" RECEIVED A PHOTO FROM : " + inp_PTX_URLobj.clnt_name);
				
				userDetails.user.forEach(function (eachClient)
				{		
					console.log(" PTX Socket: " + eachClient.name); 
					if(eachClient.name!=inp_PTX_URLobj.clnt_name)
					{
						console.log(" FORWARDED PHOTO TO : " + eachClient.name + " : " + client_Sockets[eachClient.name].id); 						
						client_Sockets[eachClient.name].emit('showPhoto', inp_PTX_URLobj.dataURL);
					}
				});
		
			//client_Sockets['dispatcher'].emit('showPhoto', inp_PTX_URLobj.dataURL);
			
		});
		
			
		socket.on('getCharts', function(msg){
		
			console.log('message: ' + msg);
			console.log(JSON.stringify(device_Info[msg]));
			socket.emit('getCharts', device_Info[msg]);
		});
  
		socket.on('getTriggers', function(msg){
		
			console.log(" REQUEST FOR TRIGGER FOR DEVICE : " + msg);
			console.log(triggerList);
			socket.emit('getTriggers', triggerList[msg]);
			
		});
		
		socket.on('getStats', function(msg){
		
			console.log('message: ' + msg);
			
			console.log("Updating stats...");
			
			var name =  stream_Info[device_Info[msg].id].streams[0].name;
			var id = device_Info[msg].id; 
			
			console.log(" STREAM NAME : " + name + " DEVICE ID : " + id);
			
  		    console.log("========== MIN ==========");
			  m2x.devices.sampleStreamValues(id, name, {"interval":"86400", "type":"min"}, function(resp)
			  {                                                    
			  	console.log("STATS INFO : " + name)
				console.log(resp.json);                          
			
				socket.emit('getStats',{"type":"min", "obj": resp.json});
			  	                
			  });                                                  
			                                                       
			  console.log("========== MAX ==========");            
			  m2x.devices.sampleStreamValues(id, name, {"interval":"86400", "type":"max"}, function(resp)
			  {                                                    
			  	console.log("STATS INFO : " + name)
				console.log(resp.json);                          
			
				socket.emit('getStats',{"type":"max", "obj": resp.json});
			  	               
			  });                                                  
			                                                       
			  console.log("========== AVG ==========");            
			  m2x.devices.sampleStreamValues(id, name, {"interval":"86400", "type":"avg"}, function(resp)
			  {
			  	console.log("STATS INFO : " + name)
				console.log(resp.json); 
			
				socket.emit('getStats',{"type":"avg", "obj": resp.json});
			  	
			  });
				
		}); 
		
		socket.on('updateStats', function(msg){
		
			console.log('message: ' + msg);
			console.log(JSON.stringify(device_Info[msg]));
			socket.emit('getCharts', device_Info[msg]);
	
		});
		
		
		socket.on('alertForPTT', function(pttAlertJSON){
		
			console.log('ALERT FOR PTT: ' + pttAlertJSON.pttUser.name);		
			
			client_Sockets[pttAlertJSON.pttUser.name].emit('alert_clnt_ForPTT', pttAlertJSON.pttObj);
				
		}); 

		socket.on('alertForPTX', function(ptxAlertJSON){
		
			console.log('ALERT FOR PTX: ' + ptxAlertJSON.ptxUser.name);		
			
			client_Sockets[ptxAlertJSON.ptxUser.name].emit('alert_clnt_ForPTX', ptxAlertJSON.ptxObj);
				
		});
		
		socket.on('openVC', function(msg_openVC){
		
			console.log('ALERT FOR openVC: ' + msg_openVC.dest);				
			
			client_Sockets[msg_openVC.dest].emit('openVC', 'openVC');
			
			//userDetails.user.forEach(function (eachClient)
			//{		
			//	if(eachClient.name!=msg_openVC.name)
			//		client_Sockets[eachClient.name].emit('openVC', 'openVC');
			//});
			
			
			//client_Sockets[eachClient.name].emit('openVC', 'openVC');
				
		});
		
		socket.on('closePTT', function(msg_closePTT){
		
			console.log('ALERT FOR PTT: ' + msg_closePTT);				
			
			userDetails.user.forEach(function (eachClient)
			{		
				if(eachClient.name!=msg_closePTT.name)
					client_Sockets[eachClient.name].emit('closePTT', 'closePTT');
			});
				
		});
		
		socket.on('closePTX', function(msg_closePTX){
		
			console.log('ALERT FOR PTX: ' + msg_closePTX);				
			
			userDetails.user.forEach(function (eachClient)
			{		
				if(eachClient.name!=msg_closePTX.name)
					client_Sockets[eachClient.name].emit('closePTX', 'closePTX');
			});
				
		});
		
		socket.on('alertForVC', function(vcAlertJSON){
		
			console.log('ALERT FOR VC: ' + vcAlertJSON);				
			client_Sockets[vcAlertJSON.vcUser.name].emit('alert_clnt_ForVC', vcAlertJSON.vcObj);
				
		});

		socket.on('alertForDroneController', function(DroneStreamAlert){
			console.log(" ALERT FOR DRONE CONTROLLER ");
			
			client_Sockets['drone'].emit('alertForDrone', DroneStreamAlert);
		});
		
		socket.on('alertForDroneStream', function(DroneStreamAlertJSON){
			console.log('ALERT FOR DroneStream: ' + DroneStreamAlertJSON);		
			//client_Sockets['drone'].emit('dispatchDrone', {"trigger_Obj":DroneStreamAlertJSON.DroneObj, "device_Info": device_Info});
			client_Sockets[DroneStreamAlertJSON.DroneUser.name].emit('alert_clnt_ForDroneStream', DroneStreamAlertJSON.DroneObj);
		});
		
  
  });

// ---------------------------------------------
// END: Boiler-plate Express app route set-up
// ---------------------------------------------

//-----------------------------------------------------------
// END: app.js
//-----------------------------------------------------------

}());
