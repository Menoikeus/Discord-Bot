const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  client.user.setGame("tennis with her friends");
  console.log('I am ready!');
});

var lastPWarning = null;
client.on('message', message => {
  var currentHour = (new Date()).getHours();
  var currentMinute = (new Date()).getMinutes();
	
  if (message.content === 'ping') {
    message.channel.send('pong');
  }
  if (message.content.includes("porn") && message.content.includes("http") && currentHour < 23 )//&& currentHour > 6)
  {
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

client.login('MzA5ODk2MDQwMjc3MDgyMTEz.C-2E4g.M1KkH422h7UYwJN1ij94QZL1Vps');