const lolapi = require("../../inhouse/lolapi.js");
const mongodb = require("../../mongodb/mongodb.js");
const redirector = require("../../mongodb/redirector.js");
const request = require('request');
var db;

exports.run = async (client, message, args) => {
  db = await mongodb.getDb();
  const directoryid = await redirector.getDirectoryId(db, message.member.guild);

  // Get inhouse account from db
  var player = await db.db(directoryid).collection("inhouse_players").find({ userid: message.member.id }).toArray();
  if(player.length == 0) return message.channel.send("You're not an inhouse player! Use !inhouse add $SUMMONER_NAME to add yourself!");
  player = player[0];

  // Get most recent three matches
  var recent_matches = player.matches.reverse().slice(0, 3);

  var stats_output;
  var match_output
  var image_url;
  // Average data for games
  if(recent_matches.length == 0) {
    // No matches = no stats
    stats_output = "There's nothing to see here";
    match_output = "You haven't played any games yet!";
    image_url = "https://i.imgur.com/vfBewGB.png";
  }
  else if(player.inhouse_stats === undefined || player.inhouse_stats.latest_matchid != recent_matches[0]) {
    // In the event that player stats stored on server are not up to date, run the functions and store the data
    // Get the match info from the db
    const all_inhouse_matches = await db.db(directoryid).collection("inhouse_matches").find({ "players.userid": message.member.id }).toArray();
    const recent_inhouse_matches = all_inhouse_matches.filter(match => recent_matches.includes(match.matchid)).reverse();

    // Static data
    const global_inhouse_info = await db.db("kami_db").collection("global_info").findOne({ info_type: "league_api_info" });
    const data_dragon_champion_list = await get_json_data_from_url("http://ddragon.leagueoflegends.com/cdn/" + global_inhouse_info.i_data_dragon_version + "/data/en_US/champion.json");
    // Create hash table where id translates to champion data
    var champion_hash_table = {};
    for(key in data_dragon_champion_list.data) {
      champion_hash_table[data_dragon_champion_list.data[key].key] = data_dragon_champion_list.data[key];
    }

    // Get new data with functions
    stats_output = calculate_average_stats(all_inhouse_matches, message.member.id);
    const recent_data = get_recent_data(champion_hash_table, recent_inhouse_matches, message.member.id);

    recent_data.average_stats = stats_output;
    recent_data.latest_matchid = recent_matches[0];
    // Push new data to db
    await db.db(directoryid).collection("inhouse_players").update(
      { userid : message.member.id },
      { $set:
        { inhouse_stats  : recent_data }
      }
    );

    // Set output strings
    match_output = recent_data.recent_matches;
    image_url = "http://ddragon.leagueoflegends.com/cdn/6.24.1/img/champion/" + recent_data.last_champion + ".png";
  }
  else {
    // Pull stored information
    stats_output = player.inhouse_stats.average_stats;
    match_output = player.inhouse_stats.recent_matches;
    image_url = "http://ddragon.leagueoflegends.com/cdn/6.24.1/img/champion/" + player.inhouse_stats.last_champion + ".png";
  }

  // create embed
  const embed = {
    "color": 16777215,
    "author": {
      "name": client.users.get(message.member.id).username + "#" + client.users.get(message.member.id).discriminator,
      "icon_url": "https://i.imgur.com/vfBewGB.png",
      "url": "http://www.lolking.net/summoner/na/" + player.leagueid
    },
    "thumbnail": {
      "url": image_url,
    },
    "fields": [
      {
        "name": "Discord ID",
        "value": message.member.id
      },
      {
        "name": "League ID",
        "value": player.leagueid,
        "inline": true
      },
      {
        "name": "Elo",
        "value": player.elo,
        "inline": true
      },
      {
        "name": "Stats",
        "value": stats_output,
        "inline": true
      },
      {
        "name": "Recent Matches",
        "value": match_output,
        "inline": true
      }
    ]
  };

  message.channel.send({ embed });
}

function calculate_average_stats(inhouse_matches, userid) {
  var total_kills = 0;
  var total_deaths = 0;
  var total_assists = 0;
  var wins = 0;
  var losses = 0;
  for(key in inhouse_matches) {
    const player_data = inhouse_matches[key].players.find(a_player => a_player.userid == userid).official_data;

    total_kills += player_data.stats.kills;
    total_deaths += player_data.stats.deaths;
    total_assists += player_data.stats.assists;

    if(player_data.stats.win) {
      wins++;
    }
    else {
      losses++;
    }
  }

  const output = "**KDA:**   " + (total_kills / inhouse_matches.length).toFixed(1) + " / " +
                (total_deaths / inhouse_matches.length).toFixed(1) + " / " +
                (total_assists / inhouse_matches.length).toFixed(1) + "\n" +
                "**W/L:**   " + (wins / (wins + losses) * 100).toFixed(1) + "%\n" +
                "**Games:**   " + (wins + losses);
  return output;
}

function get_recent_data(champion_hash_table, inhouse_matches, userid) {
  var last_champion_name;
  var match_output = "";
  for(key in inhouse_matches) {
    const player_data = inhouse_matches[key].players.find(a_player => a_player.userid == userid).official_data;

    const champion_name = champion_hash_table[player_data.championId].name;
    const KDA = player_data.stats.kills + " / " + player_data.stats.deaths + " / " + player_data.stats.assists;
    const win = "**" + (player_data.stats.win ? "W" : "L  ") + "**";
    const matchid = inhouse_matches[key].matchid;

    match_output += matchid + " | " + win + " - " + champion_name + ": " + KDA + "\n";

    last_champion_name = last_champion_name ? last_champion_name : champion_name;
  }
  return {
    recent_matches  : match_output,
    last_champion   : last_champion_name
  };
}

function get_json_data_from_url(url) {
  return new Promise((resolve, reject) => {
    request({
      url: url,
      json: true
    }, function(err, response, body) {
      if(err) throw err;
      resolve(body);
    });
  });
}
