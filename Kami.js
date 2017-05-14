const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const fs = require("fs");

// PATH
var path = require('path');
var appDir = path.dirname(require.main.filename);

// SQL
const db = require(appDir + "/mysql.js");

client.on('ready', () => {
  client.user.setGame("tennis with her friends");
  console.log('I am ready!');

  // ADDING ANY UNADDED GUILD members
  client.guilds.forEach(function(guild) {
    guild.members.forEach(function(member) {
      console.log("Trying to insert player " + member.user.username);
      var info = {
        "username"	: member.user.username,
        "userid"		: member.user.id,
    		"level"			: 0,
    		"exp"				: 0
      }

    	db.query("SELECT * FROM users WHERE userid="+member.user.id, function(error, results, fields) {
        if(error)
        {
          console.log(error);
        }
    		else if(results.length == 0)
    		{
    			db.query("INSERT INTO users SET ?", info, function(error) {
    				if(error)
    				{
    					console.log(error);
    				}
    			});
    		}
    		else {
    			console.log("Already there! ID: " + member.user.id + " " + results[0]);
    		}
      });
    });
  });
});

// event handler *********************************************
fs.readdir(appDir + "/events/", (err, files) => {
	if(err) return console.error(err);

	files.forEach(file => {
		let eventFunction = require('./events/' + file);
		let eventName = file.split(".")[0];

		client.on(eventName, (...args) => eventFunction.run(client, ...args));
	});
});

// command handler *******************************************
var lastPWarning = null;
client.on('message', message => {
	if(message.author.bot) return;

	// NONCOMMANDS
	if (message.content.includes("porn") && message.content.includes("http"))
	{
		var currentHour = (new Date()).getHours();
		if(currentHour <= 23 && currentHour > 6)
		{
			console.log("Detected!");

			if(lastPWarning != null)
			{
				lastPWarning.delete();
			}
			message.channel.send("Please no pornographic material before 12:00 AM EST").then(sameMessage => {lastPWarning = sameMessage});
			message.delete();
		}
	}

	// COMANMDS (BUT FIRST LEVEL UP STUFF)
	if(!message.content.startsWith(config.prefix))
  {
    db.query("UPDATE users SET exp = exp + 10 WHERE userid="+message.member.user.id, function(error) { if(error){console.log(error);}});
    console.log("EXP!");

    db.query("SELECT * FROM users WHERE userid="+message.member.user.id, function(error, results, fields) {
      if(error)
      {console.log(error);}
  		else if(results[0].exp >= (results[0].level+1) * 50)
  		{
        db.query("UPDATE users SET exp = exp - (level+1) * 50 WHERE userid="+message.member.user.id, function(error) { if(error) {console.log(error);}});
        db.query("UPDATE users SET level = level + 1 WHERE userid="+message.member.user.id, function(error) { if(error) {console.log(error);}});
      }
    });

    return;
  }

	let command = message.content.split(" ")[0];
	command = command.slice(config.prefix.length);

	let args = message.content.split(" ").slice(1);

	console.log(command);

	try{
		let commandFile = require('./commands/'+command+'.js');
		commandFile.run(client, message, args);
	}catch(err)
	{
		console.error(err);
	}
});

client.login(config.token);
