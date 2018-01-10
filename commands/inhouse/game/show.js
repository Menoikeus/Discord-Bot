const lolapi = require("../../../inhouse/lolapi.js");
const schedule = require('node-schedule');
const mongodb = require("../../../mongodb/mongodb.js");
const redirector = require("../../../mongodb/redirector.js");
var db;

var shown_games = {};
exports.run = async (client, message, args) => {
  db = await mongodb.getDb();
  const directoryid = await redirector.getDirectoryId(db, message.member.guild);

  if(args.length != 1) return message.channel.send("I need a match id!");
  if(isNaN(args[0])) return message.channel.send("Match ids must be numbers!");

  const match_with_id = await db.db(directoryid).collection("inhouse_matches").find({ matchid: args[0] }).toArray();
  if(match_with_id.length == 0) return message.channel.send("The match with id " + args[0] + " doesn't exist!");
  const match = match_with_id[0];

  const StatType = Object.freeze({"name":0, "kda":1, "cs":2, "elo_change":3});
  var team_1 = [];
  var team_2 = [];
  for(var i = 0; i < Object.keys(StatType).length; i++) {
    team_1[i] = new Array();
    team_2[i] = new Array();
  }

  for(key in match.players) {
    const player = match.players[key];
    // Get their name
    var name_text;
    if(player.userid === undefined) {
      name_text = "Unregistered Player";
    }
    else {
      name_text = client.users.get(player.userid).username;
    }

    // Get their stats
    const kda = player.official_data.stats.kills + " / " + player.official_data.stats.deaths + " / " + player.official_data.stats.assists;
    const creep_score = player.official_data.stats.totalMinionsKilled;
    const elo_change = player.userid === undefined ? "\u200b" : player.elo_delta;

    if(player.official_data.teamId == 100) {
      team_1[StatType.name].push(name_text);
      team_1[StatType.kda].push(kda);
      team_1[StatType.cs].push(creep_score);
      team_1[StatType.elo_change].push(elo_change);
    }
    else {
      team_2[StatType.name].push(name_text);
      team_2[StatType.kda].push(kda);
      team_2[StatType.cs].push(creep_score);
      team_2[StatType.elo_change].push(elo_change);
    }
  }

  const match_date = new Date(match.date);
  const embed = {
    "title": "Match " + match.matchid + " on " + match_date.getDate() + "/" + (match_date.getMonth()+1) + "/" + match_date.getFullYear(),
    "description": "Match ended with " + (match.winning_team == 100 ? "Blue" : "Red") + " team victory",
    "color": 16777215,
    "footer": {
      "text": match_date.toString(),
    },
    "fields": [
      {
        "name": "Blue Team",
        "value": team_1[StatType.name].join("\n"),
        "inline": true
      },
      {
        "name": "KDA",
        "value": team_1[StatType.kda].join("\n"),
        "inline": true
      },
      {
        "name": "Elo Change",
        "value": team_1[StatType.elo_change].join("\n"),
        "inline": true
      },
      {
        "name": "Red Team",
        "value": team_2[StatType.name].join("\n"),
        "inline": true
      },
      {
        "name": "KDA",
        "value": team_2[StatType.kda].join("\n"),
        "inline": true
      },
      {
        "name": "Elo Change",
        "value": team_2[StatType.elo_change].join("\n"),
        "inline": true
      }
    ]
  };

  if(shown_games[message.member.guild.id] == null) {
    shown_games[message.member.guild.id] = {};
  }
  if(shown_games[message.member.guild.id][match.matchid] != null) {
    shown_games[message.member.guild.id][match.matchid].delete();
  }
  message.channel.send({ embed }).then(
    message => {shown_games[message.member.guild.id][match.matchid] = message });
}
