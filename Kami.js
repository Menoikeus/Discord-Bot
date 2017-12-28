const Discord = require('discord.js');    // discord js api
const client = new Discord.Client();      // discord client
const config = require('./config.json');  // config json (for security)
const fs = require("fs");                 // ???
const schedule = require('node-schedule');

// Mongoose
const mongodb = require("./mongodb/mongodb.js");
mongodb.connect();
var db;

// in the beginning
client.on('ready', async () => {
  db = await mongodb.getDb();
  client.user.setGame("tennis with her friends");   // bot status

  // ADDING ANY UNADDED GUILD members
  // go through guild members and check against sql server
  await client.guilds.forEach(async function(guild) {
    var directoryid;

    var servers = await db.db("kami_db").collection("servers").find({ serverid: guild.id }).toArray();
    if (servers.length == 0) {
      var server = {
        servername: guild.name,
        serverid: guild.id,
        directoryid: guild.id
      }
      var serverObj = await db.db("kami_db").collection("servers").insertOne(server);

      var directory_info = {
        password: "password",
        associated_servers: [{
          $ref: "servers",
          $id:   serverObj.insertedId,
          $db:   "kami_db"
        }]
      }
      await db.db(guild.id).collection("info").insertOne(directory_info);

      directoryid = guild.id;
      console.log('New server ID: ' + guild.id + ' added');
    }
    else {
      directoryid = servers[0].directoryid;
    }

    guild.members.forEach(async function(member) {
      console.log("Trying to insert player " + member.user.username);
      var userObj = {
        "username" : member.user.username,
        "userid"	 : member.user.id,
    	  "level"		 : 0,
    	  "exp"      : 0
      }

      var users = await db.db(directoryid).collection("users").find({ "userid": member.user.id }).toArray();
      if (users.length == 0) {
          db.db(directoryid).collection("users").insertOne(userObj);
          console.log(member.user.username + " inserted");
      }
      else {
        console.log("Already there! ID: " + member.user.id + " " + users[0].userid);
      }
    });
  });
  console.log('I am ready!');

  // time scheduler
  // level up stuff
  schedule.scheduleJob('*/2 * * * *', async function(){
    client.guilds.forEach(async function(guild) {
      servers = await db.db("kami_db").collection("servers").find({ serverid: guild.id }).toArray();
      directoryid = servers[0].directoryid;

      await guild.channels.forEach(function(channel) {
        if(channel.id != guild.afkChannelID && channel.type == "voice") {
          channel.members.forEach(function(member) {
            db.db(directoryid).collection("users").updateOne(
              { "userid"  : member.user.id },
              { $inc: { "exp" : 1 } }
            );
          });
        }
      });

      db.db(directoryid).collection("users").find({ $where: "this.exp >= (this.level+1) * 50" }).snapshot().forEach(
        function(lpUser) {
          db.db(directoryid).collection("users").update(
            { _id: lpUser._id },
            { $set: {
              exp: lpUser.exp - (lpUser.level+1) * 50,
              level: lpUser.level + 1 } }
            );
          console.log((new Date()) + " - User " + lpUser.username + " with ID " + lpUser.userid + " leveled up to level " + (lpUser.level+1));
      });
    });
  });
});

// Status schedule
schedule.scheduleJob('* * 10 * * 6-7', function(){
 client.user.setGame("some piano");
});
schedule.scheduleJob('* * 12 * * 6-7', function(){
 client.user.setGame("video games");
});
schedule.scheduleJob('* * 7 * * 1-5', function(){
 client.user.setGame("with her cat");
});
schedule.scheduleJob('* * 15 * * 1-5', function(){
  client.user.setGame("tennis with her friends");
});
schedule.scheduleJob('* * 17 * * *', function(){
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
schedule.scheduleJob('* * 18 * * *', function(){
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
  client.user.setGame(game);
});
schedule.scheduleJob('* * 21 * * *', function(){
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
  client.user.setGame(game);
});
schedule.scheduleJob('* * 0 * * *', function(){
  client.user.setGame("some music");
});
schedule.scheduleJob('* * 22 * * 5', function(){
  client.user.setGame("beer pong at Cooper's house");
});

// event handler *********************************************
// basically separate files are called when events are triggered, rather
// than code within this file
fs.readdir("./events/", (error, files) => {     // read filesi n dir
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
client.on('message', message => {
	if(message.author.bot) return;   // make sure a human asked for this

  if(message.content.charAt(0) == "!") {
    // COMMAND HANDLING
  	let command = message.content.split(" ")[0];
  	command = command.slice(config.prefix.length);   // what command?
  	let args = message.content.split(" ").slice(1);  // we want to get rid of the actual command, which is not an argument for itself

  	try {
  		let commandFile = require('./commands/'+command+'.js');
  		commandFile.run(client, message, args);
  	}
    catch(err) {
  		console.error(err);
  	}
  }
});

client.login(config.token);
