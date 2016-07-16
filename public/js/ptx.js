 var btnStartRecording = document.querySelector('#btn-start-recording');
var btnStopRecording  = document.querySelector('#btn-stop-recording');           

			
            // global variables
            var currentBrowser = !!navigator.mozGetUserMedia ? 'gecko' : 'chromium';
            var cameraResources=[]; 
			var resourceList;
            var fileName;
            var audioRecorder;
            var videoRecorder;
            var videoElement; 
			//var Iam = window.location.pathname.split("/")[2];
			var Iam; 
			
			var socket = io();
			
			socket.emit('storePTXinfo',{"device_name":"PTX", "clnt_name": Iam} );
			
			socket.on('storePTXinfo',function(msg){ console.log("Hello PTX : " + msg); });
			
			
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
					
					document.getElementById("photoBody").style.backgroundColor = "#FF0000";
					setTimeout(function() {
						document.getElementById("photoBody").style.backgroundColor = "#000000";
					}, 1000);
					
					
					console.log(" RECEIVED PHOTO ");
					
					$("#myModal_PTX_Show").modal('toggle');
					
				});
				
            // Firefox can record both audio/video in single webm container
            // Don't need to create multiple instances of the RecordRTC for Firefox
            // You can even use below property to force recording only audio blob on chrome
            // var isRecordOnlyAudio = true;
			
			
            var isRecordOnlyAudio = !!navigator.mozGetUserMedia;
            
            // if recording only audio, we should replace "HTMLVideoElement" with "HTMLAudioElement"
            if(isRecordOnlyAudio && currentBrowser == 'chromium') {
                var parentNode = videoElement.parentNode;
                parentNode.removeChild(videoElement);
                
                videoElement = document.createElement('audio');
                videoElement.style.padding = '.4em';
                videoElement.controls = true;
                parentNode.appendChild(videoElement);
            }
								
			

	
			function errorCallback(error){
                    console.log(error);
               }
			
			var showPreview = function(name) {
			
					Iam = name; 
					
					$(document).ready(function(){
						MediaStreamTrack.getSources(function(resourceList)
						{	
							resourceList.forEach(function(eachRes)
							{
								cameraResources[eachRes.facing]=eachRes.id;
							});
							
							console.log(cameraResources);					
							
						});
					}); 
			
				
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
			
								
            // reusable helpers
            
            // this function submits both audio/video or single recorded blob to nodejs server
			
            function postFiles(mediaObj) {
				
				if(mediaObj.type=="video")
					socket.emit('forwardVideo', {"clnt_name":Iam, "dataURL": mediaObj.obj});
				if(mediaObj.type=="photo")
					socket.emit('forwardPhoto', {"clnt_name":Iam, "dataURL": mediaObj.obj});
            }
            
            // when btnStopRecording is clicked
			
			
            function onStopRecording() {
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
                            
                            postFiles({"type":"video", "obj":video});
                        });
                    }
                    
                    // if record only audio (either wav or ogg)
                   // if (isRecordOnlyAudio) postFiles(audio);
                });
            }
			
			
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

            var mediaStream = null;
            // reusable getUserMedia
			
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
            // UI events handling

			$("video").on("tap",function(){
				console.log("tap event");
			});
			
			var handleStart = function()
			{
				console.log("touch event start");
				document.getElementById("videoBody").style.backgroundColor="#3b98e9";

				btnStartRecording();		
			}
			
			var handleEnd = function()
			{
				console.log("touch event end");
				document.getElementById("videoBody").style.backgroundColor="#ffffff";
				
				btnStopRecording();
			}
			var handleMouseUp = function()
			{
				console.log("mouse event up");
				take_snapshot();
			}
			var handleMouseDwn = function()
			{
				console.log("mouse event down");
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
                        audioConfig.onAudioProcessStarted = function() {
                            // invoke video recorder in this callback
                            // to get maximum sync
                            videoRecorder.startRecording();
                        };
                    }
                    
                    audioRecorder = RecordRTC(stream, audioConfig);
                    
                    if(!isRecordOnlyAudio) {
                        // it is second parameter of the RecordRTC
                        var videoConfig = { type: 'video' };
                        videoRecorder = RecordRTC(stream, videoConfig);
                    }
                    
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
        
            window.onbeforeunload = function() {
                startRecording.disabled = false;
            };

