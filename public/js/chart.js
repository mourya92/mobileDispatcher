var stats_Info_min={};
var stats_Info_max={};
var stats_Info_avg={};
var all_Info={};


var setChartDetails = function(msg)
{
	all_Info=msg; 
	if(msg.type=="min") stats_Info_min = msg.obj; 
	if(msg.type=="max") stats_Info_max = msg.obj; 
	if(msg.type=="avg") stats_Info_avg = msg.obj; 
	
	console.log(all_Info);
}

var getChartDetails= function(msg)
{
	if(msg=="min") return stats_Info_min;
	if(msg=="avg") return stats_Info_avg; 	
	if(msg=="max") return stats_Info_max; 
}








