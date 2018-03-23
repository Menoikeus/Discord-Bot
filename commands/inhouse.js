const mongodb = require("../mongodb/mongodb.js");
const redirector = require("../mongodb/redirector.js");
var db;

var lastMessage = {};
exports.run = async (client, message, args) => {
  // if there are arguments, pass this command to the actual commands
  if(args != null && args.length > 0)
  {
    try {
      let commandFile = require('./inhouse/'+args[0]+'.js');
      commandFile.run(client, message, args.slice(1));
    }
    catch(err) {
      if(err.hasOwnProperty("code") && err.code == "MODULE_NOT_FOUND") {
    		console.error("No command with name " + args[0]);
      }
      else {
        console.log(err);
      }
    }
    return;
  }

  // If it isn't a command
  db = await mongodb.getDb();
  const directoryid = await redirector.getDirectoryId(db, message.member.guild);

  // Get the top players
  const top_players = await db.db(directoryid).collection("inhouse_players").find({}).sort({ elo: -1 }).limit(5).toArray();
  var top_player_output = get_top_players(client, top_players);
  top_player_output = top_player_output == "" ? "There's no one in the inhouse league!" : top_player_output;

  // Get recent games
  const recent_matches = await db.db(directoryid).collection("inhouse_matches").find({}).sort({ _id: -1 }).limit(5).toArray();
  var recent_matches_output = get_recent_games(recent_matches);
  recent_matches_output = recent_matches_output == "" ? "There haven't been any games yet!" : recent_matches_output;

  // Get date created
  const inhouse_info = await db.db(directoryid).collection("info").findOne({ info_type: "inhouse_info" });
  const date_created = new Date(inhouse_info.start_date);

  // create embed
  const embed = {
    "color": 16777215,
    "author": {
      "name": message.guild.name + " Inhouse League",
      "icon_url": "https://i.imgur.com/vfBewGB.png",
      "url": "http://localhost:3000/directories/" + directoryid
    },
    "thumbnail": {
      "url": message.guild.iconURL,
    },
    "fields": [
      {
        "name": "Date Created",
        "value": date_created.toDateString(),
      },
      {
        "name": "Top Players",
        "value": top_player_output,
        "inline": true
      },
      {
        "name": "Recent Matches",
        "value": recent_matches_output,
        "inline": true
      }
    ]
  };

  // delete the last profile that the user requested, so as to reduce profile spam
  if(lastMessage[message.member.guild.id] == null) {
    lastMessage[message.member.guild.id] = {};
  }
  if(lastMessage[message.member.guild.id][message.member.user.id] != null) {
    lastMessage[message.member.guild.id][message.member.user.id].delete();
  }
  message.channel.send({
    embed
  }).then( mess => {
    lastMessage[message.member.guild.id][message.member.user.id] = mess;
    try{ message.delete(); }
    catch(err){ "Missing Permissions" }
  });
}

function get_top_players(client, players) {
  var counter = 1;
  var output = "";
  for(key in players) {
    output += "**[" + counter + "]:**  " + client.users.get(players[key].userid).username + " - " + players[key].elo + "\n";
    counter++;
  }
  return output;
}

function get_recent_games(matches) {
  var output = "";
  for(key in matches) {
    const game_date = new Date(matches[key].date);
    output += "**" + matches[key].matchid + " | ** " + game_date.toLocaleDateString() + "\n";
  }
  return output;
}
