exports.run = (client, message, args) => {
	var teamMembers = args;
	  
	var blueMax = Math.ceil((teamMembers.length)/2.);
	var redMax = Math.ceil((teamMembers.length)/2.);
	  
	var blue = [];
	var red = [];
	  
	for(var i = 0; i < teamMembers.length; i++)
	{
		var teamRand = Math.floor(Math.random() * 2);
		  
		if(teamRand == 0)
		{
			if(blueMax > 0)
			{
				blue.push(teamMembers[i]);
				blueMax--;
			}
			else
			{
				red.push(teamMembers[i]);
				redMax--;
			}
		}
		else
		{
			if(redMax > 0)
			{
				red.push(teamMembers[i]);
				redMax--;
			}
			else
			{
				blue.push(teamMembers[i]);
				blueMax--;
			}
		}
	}
	  
	var output = "";
	  
	output += "__**Team 1:**__\n";
	for(var i = 0; i < blue.length; i++)
	{
		output += "*" + blue[i] + "*\n";
	}
	  
	output += "\n__**Team 2:**__\n";
	for(var i = 0; i < red.length; i++)
	{
		output += "*" + red[i] + "*\n";
	}
	  
	message.channel.send(output);	
}