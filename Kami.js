const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');

// INIT
var commandPrefix = config.prefix;
//

client.on('ready', () => {
  client.user.setGame("tennis with her friends");
  console.log('I am ready!');
});

var lastPWarning = null;
client.on('message', message => {
	if(message.content.startsWith(commandPrefix))
	{
		var currentHour = (new Date()).getHours();
		var currentMinute = (new Date()).getMinutes();
			
		if (message.content === commandPrefix + 'help')
		{
			var output = "";
			  
			  
			output += "__**List of commands**__\n\n" + 
					  "**!ping**\t\t\t\t\t\t  *Pings the bot*\n" + 
					  "**!roll *[number]***\t\t *Randomly chooses a number from 1 to \'number\', or from 1 to 6 if no number is specified*\n" + 
					  "**!team *[names]***\t\t*Creates two random teams based on the names*\n";
					  /*/
			output += "```List of commands\n\n" + 
					  "!ping\t\t\t\t\t\tPings the bot\n" + 
					  "!roll [number]\t\tRandomly chooses a number from 1 to \'number\', or from 1 to 6 if no number is specified\n" + 
					  "!team [names]\t\tCreates two random teams based on the names\n";*/
			  
			message.channel.send(output);	
		}
		
		// PING PONG *************************************
		if (message.content === commandPrefix + 'ping') {
			message.channel.send('*pong!*');
		}
		
		// DICE ROLL *************************************
		if (message.content.includes('roll')) {
			var info = message.content.split(' ');
			if(info.length == 1)
			{
				message.channel.send('**' + Math.ceil(Math.random() * 6) + '**');
			}
			else
			{
				message.channel.send('**' + Math.ceil(Math.random() * info[1]) + '**');
			}
		}
		  
		// TEAM ******************************************
		if (message.content.includes('team'))
		{
			var teamMembers = message.content.split(' ');
			  
			var blueMax = Math.ceil((teamMembers.length-1)/2.);
			var redMax = Math.ceil((teamMembers.length-1)/2.);
			  
			var blue = [];
			var red = [];
			  
			for(var i = 1; i < teamMembers.length; i++)
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
	}
		
	if (message.content.includes("porn") && message.content.includes("http") && currentHour < 23 && currentHour > 6)
	{
		console.log("Detected!");
		// console.log(typeof lastPWarning + " " + typeof message);
		if(lastPWarning != null)
		{
			lastPWarning.delete();
		}
		message.channel.send("Please no pornographic material before 11:00 PM EST").then(sameMessage => {lastPWarning = sameMessage});
		message.delete();
	}
});

client.on('guildMemberAdd', member => {
	member.guild.defaultChannel.send('Welcome to the server, ' + member + '!');
});

client.login(config.token);