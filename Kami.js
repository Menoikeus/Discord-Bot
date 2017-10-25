const Discord = require('discord.js');    // discord js api
const client = new Discord.Client();      // discord client
const config = require('./config.json');  // config json (for security)
const fs = require("fs");                 // ???
const schedule = require('node-schedule');

// PATH
var path = require('path');               // so we can get absolute path
var appDir = path.dirname(require.main.filename);

// SQL
const db = require(appDir + "/mysql.js");

// in the beginning
client.on('ready', () => {
  client.user.setGame("tennis with her friends");   // bot status
  console.log('I am ready!');

  // ADDING ANY UNADDED GUILD members
   // go through guild members and check against sql server
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
        if(error) { console.log(error); }
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

// time scheduler
// level up stuff
schedule.scheduleJob('*/2 * * * *', function(){
 client.guilds.forEach(function(guild) {
   guild.channels.forEach(function(channel) {
     if(channel.id != guild.afkChannelID && channel.type == "voice") {
      channel.members.forEach(function(member) {
        db.query("UPDATE users SET exp = exp + 1 WHERE userid="+member.user.id, function(error) {
          if(error) { console.log(error); }

          db.query("SELECT * FROM users WHERE userid="+member.user.id, function(error, results, fields) {
            if(error) { console.log(error); }
            else if(results[0].exp >= (results[0].level+1) * 50)
            {
              db.query("UPDATE users SET exp = exp - (level+1) * 50 WHERE userid="+member.user.id, function(error) { if(error) {console.log(error);}});
              db.query("UPDATE users SET level = level + 1 WHERE userid="+member.user.id, function(error) { if(error) {console.log(error);}});
            }
          });
        });
      });
     }
   });
 });
});

// weekend
schedule.scheduleJob('* * 10 * * 6-7', function(){
 client.user.setGame("some piano to relax");
});
schedule.scheduleJob('* * 12 * * 6-7', function(){
 client.user.setGame("video games with her friends");
});

// school
schedule.scheduleJob('* * 7 * * 1-5', function(){
 client.user.setGame("with her cat before school");
});
schedule.scheduleJob('* * 8 * * 1-5', function(){
 client.user.setGame("music while she does her homework");
});
schedule.scheduleJob('* * 9 * * 1-5', function(){
 client.user.setGame("piano during jazz combo");
});
schedule.scheduleJob('* * 10 * * 1-5', function(){
 client.user.setGame("with her hair in Spanish class");
});
schedule.scheduleJob('* * 11 * * 1-5', function(){
 client.user.setGame("Set during in programming class");
});
schedule.scheduleJob('* * 12 * * 1-5', function(){
 client.user.setGame("with her food at lunch");
});
schedule.scheduleJob('* * 13 * * 1-5', function(){
 client.user.setGame("with her calculator during chemistry");
});
schedule.scheduleJob('* * 14 * * 1-2,4-5', function(){
 client.user.setGame("with pulleys during physics");
});
schedule.scheduleJob('* 30 15 * * 1-2,4-5', function(){
  client.user.setGame("tennis with her friends");
});

// WEDNESDAY
schedule.scheduleJob('* * 14 * * 3', function(){
  var schoolChoice = Math.floor(Math.random() * 4);
  var schools = ["Belmont Hill", "Governer's", "Milton Academy", "Rivers"];

 client.user.setGame("in a match against " + schools[schoolChoice]);
});

schedule.scheduleJob('* 30 17 * * *', function(){
  var foodChoice = Math.floor(Math.random() * 4);
  var food;
  switch(foodChoice)
  {
    case 0: food = "a hot pocket";
      break;
    case 1: food = "pizza";
      break;
    case 2: food = "ramen";
      break;
    case 3: food = "chicken parmesan";
      break;
  }
  client.user.setGame("a movie while eating " + food);
});
schedule.scheduleJob('* 30 18 * * *', function(){
  var gameChoice = Math.floor(Math.random() * 4);
  var game;
  switch(gameChoice)
  {
    case 0: game = "Counter-Strike: Global Offensive";
      break;
    case 1: game = "League of Legends";
      break;
    case 2: game = "PUBG";
      break;
    case 3: game = "Melee";
      break;
  }
  client.user.setGame(game + " with a friend");
});
schedule.scheduleJob('* 30 21 * * 0-4,6', function(){
  var gameChoice = Math.floor(Math.random() * 5);
  var game;
  switch(gameChoice)
  {
    case 0: game = "Fire Emblem";
      break;
    case 1: game = "Breath of the Wild";
      break;
    case 2: game = "Animal Crossing";
      break;
    case 3: game = "Pokemon Sun";
      break;
    case 4: game = "Mario Kart";
      break;
  }
  client.user.setGame(game + " in her bed");
});

schedule.scheduleJob('* * 0 * * *', function(){
  client.user.setGame("some music while she sleeps");
});

// Friday beer pong!
schedule.scheduleJob('* 30 21 * * 5', function(){
  client.user.setGame("beer pong at Cooper's house");
});

// event handler *********************************************
// basically separate files are called when events are triggered, rather
// than code within this file
fs.readdir(appDir + "/events/", (err, files) => {     // read filesi n dir
	if(error) { console.log(error); }

	files.forEach(file => {
		let eventFunction = require('./events/' + file);
		let eventName = file.split(".")[0];

    // this allows us to have a variable number of arguments
		client.on(eventName, (...args) => eventFunction.run(client, ...args));
	});
});

// command handler *******************************************
// as we did with events, separate files are used when commands are called
// doing this, we can organize code better AND we can reload individual commands
// without restarting the bot
var lastPWarning = null;
client.on('message', message => {
	if(message.author.bot) return;   // make sure a human asked for this

	// NONCOMMANDS
  // Whatever happens here is not a command

  // weak content filter
	if (message.content.includes("porn") && message.content.includes("http"))
	{
		var currentHour = (new Date()).getHours();
		if(currentHour <= 23 && currentHour > 6)    // check current hour
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

  // COMMAND HANDLING
	let command = message.content.split(" ")[0];
	command = command.slice(config.prefix.length);   // what command?
	let args = message.content.split(" ").slice(1);  // we want to get rid of the actual command, which is not an argument for itself

	try{
		let commandFile = require('./commands/'+command+'.js');
		commandFile.run(client, message, args);
	}catch(err)
	{
		console.error(err);
	}
});

client.login(config.token);
