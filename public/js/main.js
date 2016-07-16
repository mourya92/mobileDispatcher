		
		var socket = io();	
		var Iam = window.location.pathname.split("/")[3];
		
		socket.on('storeInfo', function(msg)
		{					
			console.log("Hi " + msg + " From Server");
			Iam=msg; 
		});	
				
		 var device_Name; 
		 var count =0; 
		 var table_Title= "";
		 var max_HTML = "";
		 var min_HTML = "";
		 var count_HTML = "";
		 var avg_HTML = "";
		 var ar_ChartDetails ={}; 
		 var VC_origNumber = ""; 
		 var VC_termNumber = "";
		 var VC_origName = Iam; 
		 var VC_termName = "";
		 var chartsURL = ""; 
		 var clicked_ONCE = "false"; 
		 var deviceLocations = {"Test":"Collin Creek Mall", "Helmet_1":"Stadium 1", "Watch_1":"Responder_1", "Hiker_1":"Canyon_1", "Fire_1": "Downtown Dallas"};
		 var deviceInfo;
		 var TCH_ST=0;
		 var TCH_END=0;
		 var MS_ST=0;
		 var MS_END=0;
		 var video_start=0; 
		 
		var cameraResources=[]; 
		
		var closePTX = function()
			{
				socket.emit('closePTX', {"name": Iam, "msg" : "closePTX"});
				//location.reload();
			}
			
			socket.on('closePTX', function (msg_closePTX)
			{
				console.log(" ALERT PTX : " + msg_closePTX);
				
				$("#myModal_PTX").modal('toggle');
				//location.reload();
			});
			
			var goHome  = function()
			{
				window.location = "https://45.33.29.206:9001/main/" + Iam; 
			}
			
			var callback = function(msg) {
			
				console.log("UPDATED CHART: " + msg);
				document.getElementById('svg').innerHTML= msg.responseText; 
				document.getElementById('svgChart').innerHTML= msg.responseText; 
			}
			
			function httpGetAsync(theUrl, callback)
			{
				var xmlHttp = new XMLHttpRequest();
				xmlHttp.onreadystatechange = function() { 
				if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
					callback(xmlHttp);
				}
				xmlHttp.open("GET", theUrl, true); // true for asynchronous 
				xmlHttp.send(null);
			}
			
			function gotCharts(repsonse)
			{
				
				JSON.parse(repsonse.responseText).charts.forEach( function (chart)
				{
					
					if(chart.name==device_Name)
						chartsURL= chart.render.svg + "?width=300&height=500&type=values"
				});
				
				console.log(" CHARTS URL : " + chartsURL);
				
				httpGetAsync(chartsURL, callback);
				
			}
			
			function httpGetCharts(theUrl, gotCharts)
			{
				var xmlHttp = new XMLHttpRequest();
				xmlHttp.onreadystatechange = function() { 
				if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
					gotCharts(xmlHttp);
				}
				xmlHttp.open("GET", theUrl, true); // true for asynchronous 
				xmlHttp.setRequestHeader("X-M2X-KEY", "786fcfb182b51012063b36440b70ab74");
				xmlHttp.send(null);
			}
			
			
			$(document).ready(function(){
					
					document.getElementById("deviceText").innerHTML = "Device Name : " + window.location.pathname.split("/")[2];
					httpGetCharts("https://api-m2x.att.com/v2/charts/", gotCharts);
					
			});
			
			
			var isRecordOnlyAudio = !!navigator.mozGetUserMedia;			
		
			MediaStreamTrack.getSources(function(resourceList)
			{	
				resourceList.forEach(function(eachRes)
				{
					cameraResources[eachRes.facing]=eachRes.id;
				});
			
				console.log(cameraResources);					 
			
			});
			
			function errorCallback(error){
				console.log(error);
			}
				
				
			var showPreview = function() {
				
					var constraints = {
							audio: true,
							video: {
									optional: [{sourceId: cameraResources["environment"]}]
							}
					};

					navigator.getUserMedia(constraints, function(stream) {
					
										
										document.getElementById('video').src = window.URL.createObjectURL(stream);
										document.getElementById('video').play();
										document.getElementById('video').muted = true;
										document.getElementById('video').controls = false;
										
										$("#myModal_PTX").modal('toggle');
										
										$("video").bind("contextmenu",function(){
										return false;
										});
			
									    videoElement= document.getElementById('video');	
										
										videoElement.addEventListener("touchstart", handleStart, false);
										videoElement.addEventListener("touchend", handleEnd, false);
										videoElement.addEventListener("mouseup", handleMouseUp, false);
										videoElement.addEventListener("mousedown", handleMouseDwn, false);
										
							}, errorCallback);
							
					
				}
			
			 function captureUserMedia(success_callback) {
                var session = {
                    audio: true,
                    video: {
							optional: [{sourceId: cameraResources["environment"]}]
						}
                };
                
                navigator.getUserMedia(session, success_callback, function(error) {
                    alert( JSON.stringify(error) );
                });
            }
			
				
			$("video").on("tap",function(){
				console.log("tap event");
			});
			
			var setEvent = function(event)
			{
				console.log(event);	
			}
			
			var handleStart = function()
			{
				console.log("touch event start");
				document.getElementById("videoBody").style.backgroundColor="#3b98e9";

				//btnStartRecording();		
				TCH_ST=1; 
				setTimeout(function() {
					if(MS_ST!=1)
					{
							console.log('video start recording');
							btnStartRecording();
							video_start=1;
					}
				}, 1000);
				setEvent("TCH_ST");
			}
			
			var handleEnd = function()
			{
				console.log("touch event end");
				document.getElementById("videoBody").style.backgroundColor="#ffffff";
				
				//btnStopRecording();
				TCH_END=1;
				if(video_start==1)
				{
						console.log('video end');
						btnStopRecording();
						video_start=0;
				}
					
				setEvent("TCH_END");
			}
			var handleMouseUp = function()
			{
				console.log("mouse event up");
			
				take_snapshot();
				console.log(' Take picture ');
				MS_ST=1;
				setTimeout(function() {
					MS_ST=0;
				}, 1500);
				setEvent("MS_ST");
			}
			var handleMouseDwn = function()
			{
				//console.log("mouse event down");
				MS_END=1;
				setEvent("MS_END");
			}
			
			var btnStartRecording = function() {
                //btnStartRecording.disabled = true;
                
				console.log('STARTED RECORDING....');
				
                captureUserMedia(function(stream) {
                    mediaStream = stream;
                    
                    document.getElementById('video').src = window.URL.createObjectURL(stream);
                    document.getElementById('video').play();
                    document.getElementById('video').muted = true;
                    document.getElementById('video').controls = false;
                    
                    // it is second parameter of the RecordRTC
                    var audioConfig = {};
                       if(!isRecordOnlyAudio) {
                        // it is second parameter of the RecordRTC
                        var videoConfig = { type: 'video' };
                        videoRecorder = RecordRTC(stream, videoConfig);
                    }
					if(!isRecordOnlyAudio) {
                        audioConfig.onAudioProcessStarted = function() {
                            // invoke video recorder in this callback
                            // to get maximum sync
                            videoRecorder.startRecording();
                        };
                    }
                    
                    audioRecorder = RecordRTC(stream, audioConfig);
                    
                 
                    videoRecorder.startRecording();
                    audioRecorder.startRecording();
                    
                    // enable stop-recording button
                    //btnStopRecording.disabled = false;
                });
            };


            var btnStopRecording = function() {
                //btnStartRecording.disabled = false;
                //btnStopRecording.disabled = true;
                
                if(isRecordOnlyAudio) {
                    audioRecorder.stopRecording(onStopRecording);
                }

                if(!isRecordOnlyAudio) {
                    audioRecorder.stopRecording(function() {
                        videoRecorder.stopRecording(function() {
                            onStopRecording();
                        });
                    });
                }
				
				//$("#myModal_PTX").modal('toggle');
            };
			
			
				function take_snapshot() {
	
						console.log(" PHOTO TAKEN ");
						
                        video = $("#video").get(0);
                        var scale = 1.0;
                        var canvas = document.createElement("canvas");
                        canvas.width = video.videoWidth * scale;
                        canvas.height = video.videoHeight * scale;
                        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
                  						
						var audio = new Audio('shutter.mp3');
						audio.play();
						postFiles({"type":"photo", "obj":canvas.toDataURL()});                    
				}
				
					
            function postFiles(mediaObj) {
				
				console.log(" FILES READY TO BE SENT");
				
				if(mediaObj.type=="video")
					socket.emit('forwardVideo', {"clnt_name":Iam, "dataURL": mediaObj.obj});
				if(mediaObj.type=="photo")
					socket.emit('forwardPhoto', {"clnt_name":Iam, "dataURL": mediaObj.obj});
            }
			
						

			
			function onStopRecording() {
			
				console.log(" STOPPED STREAMING ");
                audioRecorder.getDataURL(function(audioDataURL) {
                    var audio = {
                        blob: audioRecorder.getBlob(),
                        dataURL: audioDataURL
                    };
                    
                    // if record both wav and webm
                    if(!isRecordOnlyAudio) {
                        videoRecorder.getDataURL(function(videoDataURL) {
                            var video = {
                                blob: videoRecorder.getBlob(),
                                dataURL: videoDataURL
                            };
                            
							if(MS_ST==0)
								postFiles({"type":"video", "obj":video});
                        });
                    }
                    
                    // if record only audio (either wav or ogg)
                   // if (isRecordOnlyAudio) postFiles(audio);
                });
            }
		
			var showDevicePage = function(dev_Name)
			{	
				window.location='https://45.33.29.206:9001/m2x/' + dev_Name + '/' + Iam;
			}
									
			var updateChart = function(msg) {
			
				console.log(msg);
				if(null!=document.getElementById('svg'))
					document.getElementById('svg').innerHTML = msg.responseText; 
				if(null!=document.getElementById('svgChart'))
					document.getElementById('svgChart').innerHTML = msg.responseText; 
			}
			
		
		$(document).ready(function(){
		
			device_Name = window.location.pathname.split("/")[2];
			
		
			document.getElementById('deviceName').innerHTML = "Device Name : " + device_Name; 
			document.getElementById('locationName').innerHTML = "Location : " + deviceLocations[device_Name];
			
			socket.emit('storeInfo', {"device_name":device_Name, "clnt_name": Iam}); 
		
			$("#devID").click(function(){					
				 
				 console.log(' devices clicked ');
				 clicked_ONCE = "true"; 
				 document.getElementById('tab_devID').class = "active";
				 document.getElementById('tab_chartID').class = "";
				 document.getElementById('tab_statsID').class = "";
				 document.getElementById('tab_trigID').class = "";
				 
				 socket.emit('getDevices', Iam);	 
				 
			});
			
			$("#chartID").click(function(){					
				 
				 console.log(' chart clicked ');
				 
				 document.getElementById('tab_chartID').class = "active";
				 document.getElementById('tab_statsID').class = "";
				 document.getElementById('tab_trigID').class = "";
				 document.getElementById('tab_devID').class = "";
				 socket.emit('getCharts', device_Name);		
				 
			     httpGetAsync(chartsURL, updateChart);				 
				 document.getElementById('mainDisplay').innerHTML= document.getElementById('Chart').innerHTML;
				 
			});
			
			$("#refreshChartID").click(function(){					
				 
				 console.log(' chart refresh clicked ');	
				 document.getElementById('mainDisplay').innerHTML= document.getElementById('Chart').innerHTML;		 
				 
			});
		
			$("#statsID").click(function(){					
				 
				 document.getElementById('tab_statsID').class = "active";
				 document.getElementById('tab_chartID').class = "";
				 document.getElementById('tab_trigID').class = "";
				 document.getElementById('tab_devID').class = "";
				 socket.emit('getStats', device_Name);
				 document.getElementById('mainDisplay').innerHTML= document.getElementById('Collapse').innerHTML;				 
			});
			
			$("#trigID").click(function(){					
				 
				 document.getElementById('tab_statsID').class = "";
				 document.getElementById('tab_chartID').class = "";
				 document.getElementById('tab_trigID').class = "active";
				 document.getElementById('tab_devID').class = "";
				 socket.emit('getTriggers', device_Name);		 
			});
			
			$("#teamID").click(function(){
				
				 document.getElementById('tab_teamID').class = "active";
				 document.getElementById('tab_statsID').class = "";
				 document.getElementById('tab_chartID').class = "";
				 document.getElementById('tab_trigID').class = "";
				 document.getElementById('tab_devID').class = "";
				 
				 document.getElementById('mainDisplay').innerHTML= document.getElementById('Team').innerHTML;		
				 loadMap();
			});
		
			socket.on('showDevices', function(device_List, ar_chartUpdate_Cnt)
			{	
				console.log(device_List);
				deviceInfo = device_List;
				console.log(ar_chartUpdate_Cnt);
				var str_dispList = "";
				
				for(var device in device_List)
				{
					console.log(" DEVICE  : " + device_List[device].name);
					
					str_dispList = str_dispList + '<div class="list-group-item" onClick="showDevicePage(\'' + device_List[device].name + '\')">'; 
					
					if(device_List[device].name.indexOf("Watch")!=-1)
						str_dispList = str_dispList + '<img src="../../watch.png"/>';
					if(device_List[device].name.indexOf("Fire")!=-1)
						str_dispList = str_dispList + '<img src="../../fire.png"/>';
					if(device_List[device].name.indexOf("Hiker")!=-1)
						str_dispList = str_dispList + '<img src="../../climb.png"/>';
					if(device_List[device].name.indexOf("Helmet")!=-1)
						str_dispList = str_dispList + '<img src="../../helmet.png"/>';
					
					if(ar_chartUpdate_Cnt[device_List[device].name]==null)
						str_dispList = str_dispList + '<span class="badge" id="span_'+ device_List[device].name + '">0</span>'; 
					else
						str_dispList = str_dispList + '<span class="badge" id="span_'+ device_List[device].name + '">' + ar_chartUpdate_Cnt[device_List[device].name] + '</span>'; 
					
					str_dispList = str_dispList + '<dt id="'+ device_List[device].name + '" style="display:inline">' + device_List[device].name + '</dt>'; 
					str_dispList = str_dispList + '<p> location : ' + device_List[device].location.name + '</p>'; 
					str_dispList = str_dispList + '</div>';
				};	
				
				document.getElementById("mainDisplay").innerHTML = str_dispList; 
			});			
			
			socket.on('getTriggers', function(trigInfo)			
			{	
				var str_dispList=""; 
				
				console.log(trigInfo);
				
				for(var trig_List in trigInfo)
				{
					for(var trig in trig_List)
					{	
						console.log(trigInfo[trig_List[trig]]);
						str_dispList = str_dispList + '<div class="list-group-item">';
						str_dispList = str_dispList + '<dt style="display:inline">' +trigInfo[trig_List[trig]].severity + '</dt>';
						str_dispList = str_dispList + '<p> Value : ' + trigInfo[trig_List[trig]].value + "	" + trigInfo[trig_List[trig]].time + '</p>';
						str_dispList = str_dispList + '</div>';
					}
				}
				document.getElementById('mainDisplay').innerHTML = str_dispList ; 
				
			});
		
		    socket.on('updateChart', function(msg)
		    	{					
		    		console.log(msg);
					httpGetAsync(chartsURL, updateChart);
					if(document.getElementById('span_' + msg.deviceName)!=null)
							document.getElementById('span_' + msg.deviceName).innerHTML=msg.count; 
		    	});
		    

			
		    socket.on('getCharts', function(msg)
		    	{					
		    		console.log(msg);
		    	});	
		    	
		    socket.on('getStats', function(msg)
		    	{					
					console.log(msg.type);
					
					if(msg.type=="min") ar_ChartDetails['min'] = msg.obj; 
					if(msg.type=="max") ar_ChartDetails['max'] = msg.obj; 					
					if(msg.type=="avg") ar_ChartDetails['avg'] = msg.obj;					
		    	});
				
				
				socket.on('alert_clnt_ForPTT', function(pttAlertJSON)
		    	{		
					var PTTuserDetails = []; 
					var origNumber = ""; 
					var termNumber = "";
					var origName = Iam; 
					var termName = "";					
					
					pttAlertJSON.userObj.user.forEach(function (eachPTTuser)
					{
							if(Iam==eachPTTuser.name)
								{
									origNumber = eachPTTuser.PTT_Number_O; 
									termNumber = eachPTTuser.PTT_Number_T + "," + eachPTTuser.PTT_Number_Disp;
								}
							else	
								termName = eachPTTuser.name;
					}); 
					
					console.log(" LOGIN TO PTT WITH MDN : " + origNumber + "TERM MDN : " + termNumber);
					
					//document.getElementById("Orig").innerHTML = "Originator : " + origName;
					//document.getElementById("Term").innerHTML = "Terminator : " + termName;
					document.getElementById("pttiframe").src="https://wcsr.ms2l.kodiakgw.com/PTTButtonWidget/HelloPTT.html?orig=" + origNumber + "&term=" + termNumber;			
	
					$("#myModal_PTT").modal('toggle');
		    	});
				
				socket.on('alert_clnt_ForPTX', function(ptxAlertJSON)
		    	{		
					var PTXuserDetails = []; 
					var origNumber = ""; 
					var termNumber = "";
					var origName = Iam; 
					var termName = "";					
					
					showPreview();	
					
					console.log(" LOGIN TO PTX WITH MDN : " + Iam);		
		    	});
				
				socket.on('playVideo', function(inputURL)			
				{
					
					document.getElementById("video_Play").src = inputURL.dataURL; 
					document.getElementById("video_Play_Body").style.backgroundColor = "#3b98e9";
					console.log(" RECEIVED VIDEO ");
					
					$("#myModal_PTX_Play").modal('toggle');
					
				});
			
				socket.on('showPhoto', function(inputURL)			
				{
					
					document.getElementById("photo_Show").poster = inputURL; 
					setTimeout(function() {
						document.getElementById("photoBody").style.backgroundColor = "#FF0000";
					}, 1000);
					
					
					console.log(" RECEIVED PHOTO ");
					
					$("#myModal_PTX_Show").modal('toggle');
					
				});
				
				socket.on('alert_clnt_ForVC', function(vcAlertJSON)
		    	{		
					var VCuserDetails = []; 
					
					
					vcAlertJSON.userObj.user.forEach(function (eachVCuser)
					{
							if(Iam==eachVCuser.name)
								{
									VC_origNumber = eachVCuser.WebRTC_Number_O; 
									VC_termNumber = eachVCuser.WebRTC_Number_T;
								}
							else	
								VC_termName = eachVCuser.name;
					}); 
					
					console.log(" LOGIN TO WebRTC Video Calling WITH MDN : " + VC_origNumber + "TERM MDN : " + VC_termNumber);
					
					document.getElementById("VC_Orig").innerHTML = "Originator : " + Iam;
					document.getElementById("VC_Term").innerHTML = "Terminator : " + VC_termName;
					
					$("#VCModal").modal('toggle');
					
		    	});
				
				socket.on('alert_clnt_ForDroneStream', function(DroneStreamAlertJSON)
		    	{

					$("#DroneModal").modal('toggle');
					
		    	});
				
				
				socket.on('closePTT', function(msg_closePTT)
				{
					$("#myModal_PTT").modal('hide');
				});
				
				socket.on('closePTX', function(msg_closePTX)
				{
					$("#myModal_PTX").modal('hide');
				});
				
				socket.on('openVC', function(msg_openVC)
				{
					console.log(" START VIDEO CALL : Orig = "  + Iam + "Term = " + VC_termNumber);
					window.location="https://45.33.29.206:9001/callTest/" + Iam + "/" + VC_termNumber;
				});
				
				socket.on('openDrone', function(msg_openDrone)
				{
					$("#DroneModal").modal('toggle');
					$("#LiveDisplay").modal('toggle');	
				});
				
				
				
				
				
				socket.on('rcvTrigger', function(clnt_Info)
		    	{					
					trigger_clnt_Info = clnt_Info; 
					
		    		console.log(trigger_clnt_Info);
					
					if('Text'==trigger_clnt_Info.trgObj.trigger)
					{
						document.getElementById("smsButton").disabled = false; 
						document.getElementById("trig_InfoDisp").innerHTML = "Normal Alert";
						alerttype = "Normal Alert"; 
						$("#teamID").click();
						person[0] = trigger_clnt_Info.trgObj.location.name;
						latitude[0] = trigger_clnt_Info.trgObj.location.latitude;
						longitude[0] = trigger_clnt_Info.trgObj.location.longitude;
						for (i=1; i<5; i++){
							person[i] = JSON.parse(trigger_clnt_Info.trgObj.custom_data).device[i-1].name;
							latitude[i] = JSON.parse(trigger_clnt_Info.trgObj.custom_data).device[i-1].lat;
							longitude[i] = JSON.parse(trigger_clnt_Info.trgObj.custom_data).device[i-1].lng;
							
						}
						loadMap();
					}
					if('PTT'==trigger_clnt_Info.trgObj.trigger)
					{
						document.getElementById("smsButton").disabled = false; 
						document.getElementById("trig_InfoDisp").innerHTML = "Minor Alert"; 
						alerttype = "Minor Alert";
						$("#teamID").click();
						person[0] = trigger_clnt_Info.trgObj.location.name;
						latitude[0] = trigger_clnt_Info.trgObj.location.latitude;
						longitude[0] = trigger_clnt_Info.trgObj.location.longitude;
						for (i=1; i<5; i++){
							person[i] = JSON.parse(trigger_clnt_Info.trgObj.custom_data).device[i-1].name;
							latitude[i] = JSON.parse(trigger_clnt_Info.trgObj.custom_data).device[i-1].lat;
							longitude[i] = JSON.parse(trigger_clnt_Info.trgObj.custom_data).device[i-1].lng;
						}
						loadMap();
					}
					if('PTX'==trigger_clnt_Info.trgObj.trigger)
					{
						document.getElementById("smsButton").disabled = false; 
						document.getElementById("trig_InfoDisp").innerHTML = "Major Alert"; 
						alerttype = "Major Alert";
						$("#teamID").click();
						person[0] = trigger_clnt_Info.trgObj.location.name;
						latitude[0] = trigger_clnt_Info.trgObj.location.latitude;
						longitude[0] = trigger_clnt_Info.trgObj.location.longitude;
						for (i=1; i<5; i++){
							person[i] = JSON.parse(trigger_clnt_Info.trgObj.custom_data).device[i-1].name;
							latitude[i] = JSON.parse(trigger_clnt_Info.trgObj.custom_data).device[i-1].lat;
							longitude[i] = JSON.parse(trigger_clnt_Info.trgObj.custom_data).device[i-1].lng;
							loadMap();
						}
						loadMap();
					}
					if('Video'==trigger_clnt_Info.trgObj.trigger)
					{
						document.getElementById("smsButton").disabled = false; 
						document.getElementById("trig_InfoDisp").innerHTML = "Crtitcal Alert";
						alerttype = "Critical Alert";
						$("#teamID").click();
						person[0] = trigger_clnt_Info.trgObj.location.name;
						latitude[0] = trigger_clnt_Info.trgObj.location.latitude;
						longitude[0] = trigger_clnt_Info.trgObj.location.longitude;
						for (i=1; i<5; i++){
							person[i] = JSON.parse(trigger_clnt_Info.trgObj.custom_data).device[i-1].name;
							latitude[i] = JSON.parse(trigger_clnt_Info.trgObj.custom_data).device[i-1].lat;
							longitude[i] = JSON.parse(trigger_clnt_Info.trgObj.custom_data).device[i-1].lng;
							
						}
						loadMap();
					}
					if('Drone'==trigger_clnt_Info.trgObj.trigger)
					{					
						document.getElementById("smsButton").disabled = false; 
						document.getElementById("trig_InfoDisp").innerHTML = "Catastrophe Alert";
						alerttype = "Catastrophe Alert";	
						$("#teamID").click();
						person[0] = trigger_clnt_Info.trgObj.location.name;
						latitude[0] = trigger_clnt_Info.trgObj.location.latitude;
						longitude[0] = trigger_clnt_Info.trgObj.location.longitude;
						for (i=1; i<5; i++){
							person[i] = JSON.parse(trigger_clnt_Info.trgObj.custom_data).device[i-1].name;
							latitude[i] = JSON.parse(trigger_clnt_Info.trgObj.custom_data).device[i-1].lat;
							longitude[i] = JSON.parse(trigger_clnt_Info.trgObj.custom_data).device[i-1].lng;
						}
						loadMap();
					}
					
						var userNames= ""; 
						
						trigger_clnt_Info.userObj.user.forEach(function(eachUser)
						{
							userNames = userNames + ", " + eachUser.name; 
						});
						
						console.log("Alert " + userNames);
						
						document.getElementById("trig_BodyDisp").innerHTML = "Alert " + userNames; 
						
						$("#myModalDisp").modal('toggle');
						
						
		    	});
		
		});

			var startVideoCall = function()
			{
				socket.emit('openVC', {"name": Iam, "msg": "openVC", dest:"dispatcher"});
				
				console.log(" START VIDEO CALL : Orig = "  + VC_origNumber + "Term = " + VC_termNumber);
				window.location="https://45.33.29.206:9001/callTest/" + VC_origNumber + "/" + VC_termNumber;			
			}
		 
			var startDroneStream = function()
			{
				socket.emit('openDrone', {"name": Iam, "msg": "openDrone"});
				
				$("#DroneModal").modal('toggle');
				$("#LiveDisplay").modal('toggle');			
			}
		 
		    var dispTable = function(type)
			{
			
				var tableHead='<table class="table table-condensed table-bordered"><thead><tr>';
				var ar_tableHead = ["#", "Date/Time", "Value", "Remarks"];
				var class_list = ["normal", "active", "success","warning", "danger"];
				var count =0;
				
				ar_tableHead.forEach(function(item, index)
				{
					tableHead = tableHead + "<th>" + item + "</th>"; 
				}); 
				
				tableHead = tableHead + "</thead></tr><tbody>"; 
			
				ar_ChartDetails[type].values.forEach(function(item, index)
				{
					tableHead = tableHead + "<tr class=" + class_list[count%5] + ">";
					tableHead = tableHead + "<td>" + (count++) +"</td>"; 
					tableHead = tableHead + "<td>" + item.timestamp.split('T')[0] +"</td>"; 
					tableHead = tableHead + "<td>" + item.value +"</td>"; 
					tableHead = tableHead + "<td>" + class_list[count%5] +"</td>";
					tableHead = tableHead + "</tr>";
				}); 
				document.getElementById(type+"ID").innerHTML = tableHead; 
						
				tableHead = tableHead + "</tbody></table>"; 
			}
			
			
			var ptt_closeOtherEnd = function()
			{
				socket.emit('closePTT', {"name": Iam, "msg": "closePTT"});
			}
			
			var ptx_closeOtherEnd = function()
			{
				socket.emit('closePTX', {"name": Iam, "msg": "closePTX"});
			}
			
			
			var takeAction =function(id)
			{
				
				if("smsButton"== id)
					{
						trigger_clnt_Info.userObj.user.forEach(function(eachUser)
						{
							 sendsms(eachUser.SMS_Number, "Hey " + eachUser.name + " be alert ! There is an alarm from device name : Test"); 
						});
					}
					
				if("pttButton"== id)
					{
						trigger_clnt_Info.userObj.user.forEach(function(eachUser)
						{
							 socket.emit('alertForPTT', {"pttUser":eachUser, "pttObj": trigger_clnt_Info});
						});
					}
				
				if("ptxButton"== id)
					{
						console.log(" PTX BUTTON CLICKED ");
						
						trigger_clnt_Info.userObj.user.forEach(function(eachUser)
						{
							 socket.emit('alertForPTX', {"ptxUser":eachUser, "ptxObj": trigger_clnt_Info});
						});
					}
					
				
				if("vcButton"== id)
					{
						trigger_clnt_Info.userObj.user.forEach(function(eachUser)
						{
							 socket.emit('alertForVC', {"vcUser":eachUser, "vcObj": trigger_clnt_Info});
						});
					}
					
				if("droneButton"== id)
					{
						
						trigger_clnt_Info.userObj.user.forEach(function(eachUser)
						{
							 socket.emit('alertForDroneStream', {"DroneUser":eachUser, "DroneObj": trigger_clnt_Info});
						});
					}
			
			}
			
			var sendsms = function (number, text)
			{
						var xhttp = new XMLHttpRequest();
						xhttp.onreadystatechange = function() {
						
						if (xhttp.readyState == 4 && xhttp.status == 200) {
								document.getElementById("demo").innerHTML = xhttp.responseText;
							}
						};
						
						xhttp.open("GET", "https://45.33.29.206:9001/sendsms/" + number + "/" + text, true);
						xhttp.send();				
			}
			
			
		   //============================================ MAPS LOGIC START =================================
			var alerttype;
			var map;
			var marker;
			var marker_nop;
			var marker_fresp;
			var infowindow;
			var person = ["Collin Creek Mall","Stadium 1","Lewisville Lake","Canyon 1","Downtown Dallas"],latitude = ["33.0131027","32.745942","33.063678","36.08240162","32.7766642"],longitude = ["-96.7099442","-97.0957095","-96.993924","-112.1566772","-96.7969879"]; 
			
			var loadMap = function()
			{
				var mapProp = {
					center:new google.maps.LatLng(32.911348,-96.892687),
					zoom:10,
					mapTypeId:google.maps.MapTypeId.ROADMAP
					};
					
				map =new google.maps.Map(document.getElementById("googleMap"),mapProp);
				
				if (person[1] == "Stadium 1"){
					locate(person[0],latitude[0],longitude[0]);
					locate(person[1],latitude[1],longitude[1]);
					locate(person[2],latitude[2],longitude[2]);
					locate(person[4],latitude[4],longitude[4]);
					}
				else {
					if (person[0]== "Collin Creek Mall" || person[0]== "Stadium 1" || person[0]== "Lewisville Lake" || person[0]== "Canyon 1" || person[0]== "Downtown Dallas"){
							map.setCenter(new google.maps.LatLng(latitude[0],longitude[0]));
							map.setZoom(10);
						}
					for (i=0;i<person.length;i++){
						locate(person[i],latitude[i],longitude[i]);
				}
				}
			
			
			function locate(name,lat,lng){
				var a = new google.maps.LatLng(lat,lng);
				var name = name;
				console.log(name);
				if (name == "drone"){
				marker_nop=new google.maps.Marker({
					position:a,
					icon: '../../drone.png',
					title: name
					});
					
					marker_nop.setMap(map);
					
					infowindow = new google.maps.InfoWindow({
						content:name
					});			
					
					infowindow.open(map,marker_nop);
				}
				else if (name=="dispatcher"){
				marker=new google.maps.Marker({
					position:a,
					icon: '../../dispatcher.png',
					title: name
					});
					
					marker.setMap(map);
					infowindow = new google.maps.InfoWindow({
						content:name
					});			
					
					infowindow.open(map,marker);
					marker.addListener('mousedown',markerpopup);
				}
				else if (name=="Bob" || name=="Alice"){
				marker_nop=new google.maps.Marker({
					position:a,
					icon: '../../phone.gif',
					title: name
					});
					
					marker_nop.setMap(map);
					infowindow = new google.maps.InfoWindow({
						content:name
					});			
					
					infowindow.open(map,marker_nop);
					
				}
				else{
				marker_fresp=new google.maps.Marker({
					position:a,
					icon: '../../fire.png',
					title: name
					});
				if(name == "Downtown Dallas"){
					marker_fresp.setIcon("../../fire.png");
				}
				if(name == "Stadium 1"){
					marker_fresp.setIcon("../../helmet.png");
				}
				if(name == "Lewisville Lake"){
					marker_fresp.setIcon("../../watch.png");
				}
				if(name == "Canyon 1"){
					marker_fresp.setIcon("../../climb.png");
				}
				if(name == "Collin Creek Mall"){
					marker_fresp.setIcon("../../fire.png");
				}
					marker_fresp.setMap(map);
					
					infowindow = new google.maps.InfoWindow({
						content:name
					});			
					
					infowindow.open(map,marker_fresp);
					marker_fresp.addListener('mousedown',marker_Fresp);
				}				
				
				
			}
			}
			
			
			function markerpopup(){
				document.getElementById("smsButton").disabled = false; 
				document.getElementById("trig_InfoDisp").innerHTML = alerttype; 
				$("#myModalDisp").modal('toggle');
			}
			
			function marker_Fresp(){
				document.getElementById("smsButton").disabled = false; 
				document.getElementById("trig_InfoFresp").innerHTML = marker_fresp.title; 
				$("#myModalFresp").modal('toggle');
			}
	
	//============================================ MAPS LOGIC END=================================
			
		    socket.on('clntrcvTrigger', function(clnt_Info)
		    	{					
					trigger_clnt_Info = clnt_Info; 
					
		    		console.log(trigger_clnt_Info);
					
						//document.getElementById("smsButton").disabled = false; 
						document.getElementById("trig_Info").innerHTML = "Normal Alert";
						alerttype = "Normal Alert"; 
						$("#teamID").click();
						person[0] = trigger_clnt_Info.trgObj.location.name;
						latitude[0] = trigger_clnt_Info.trgObj.location.latitude;
						longitude[0] = trigger_clnt_Info.trgObj.location.longitude;
						
						for (i=1; i<5; i++){
							person[i] = JSON.parse(trigger_clnt_Info.trgObj.custom_data).device[i-1].name;
							latitude[i] = JSON.parse(trigger_clnt_Info.trgObj.custom_data).device[i-1].lat;
							longitude[i] = JSON.parse(trigger_clnt_Info.trgObj.custom_data).device[i-1].lng;
							
						}
						loadMap();
					
					
						var userNames= ""; 
						
						trigger_clnt_Info.userObj.user.forEach(function(eachUser)
						{
							userNames = userNames + " " + eachUser.name; 
						});
						
						console.log("Alert " + userNames);
						
						document.getElementById("trig_Body").innerHTML = " Device Location : " + trigger_clnt_Info.trgObj.location.name; 
						
						$("#myModal").modal('toggle');
						
						
		    	});
		    	
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			


			
