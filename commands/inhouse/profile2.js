const lolapi = require("../../inhouse/lolapi.js");
const mongodb = require("../../mongodb/mongodb.js");
const redirector = require("../../mongodb/redirector.js");
const request = require('request');
var db;

var lastMessage = {};
exports.run = async (client, message, args) => {
  db = await mongodb.getDb();
  const directoryid = await redirector.getDirectoryId(db, message.member.guild);

  // Get inhouse account from db
  var player = await db.db(directoryid).collection("inhouse_players").findOne({ userid: message.member.id });
  if(player === undefined) return message.channel.send("You're not an inhouse player! Use !inhouse add $SUMMONER_NAME to add yourself!");

  var overall_stats;
  var recent_data;
  // Average data for games
  if(player.matches.length == 0) {
    // No matches = no stats
    stats_output = "There's nothing to see here";
    match_output = "You haven't played any games yet!";
    image_url = "https://i.imgur.com/vfBewGB.png";
  }
  else if(player.inhouse_stats === undefined || player.inhouse_stats.latest_matchid != player.matches[player.matches.length - 1]) {
    // In the event that player stats stored on server are not up to date, run the functions and store the data
    // Get all matches with the player
    const all_inhouse_matches = await db.db(directoryid).collection("inhouse_matches").find({ "players.userid": message.member.id }).sort({ date: -1 }).toArray();
    const recent_inhouse_matches = all_inhouse_matches.slice(0, 3);

    // Static data
    const global_inhouse_info = await db.db("kami_db").collection("global_info").findOne({ info_type: "league_api_info" });
    const data_dragon_champion_list = await get_json_data_from_url("http://ddragon.leagueoflegends.com/cdn/" + global_inhouse_info.i_data_dragon_version + "/data/en_US/champion.json");
    // Create hash table where id translates to champion data
    var champion_hash_table = {};
    for(key in data_dragon_champion_list.data) {
      champion_hash_table[data_dragon_champion_list.data[key].key] = data_dragon_champion_list.data[key];
    }

    // Get new data with functions
    overall_stats = calculate_average_stats(all_inhouse_matches, message.member.id);
    recent_data = get_recent_data(champion_hash_table, recent_inhouse_matches, message.member.id, global_inhouse_info, client);

    const latest_matchid = recent_data.recent_matches[0].matchid;
    // Push new data to db
    await db.db(directoryid).collection("inhouse_players").update(
      { userid : message.member.id },
      { $set:
        {
          inhouse_stats: {
            overall_stats  : overall_stats,
            recent_data    : recent_data,
            latest_matchid : latest_matchid
          }
        }
      }
    );
  }
  else {
    // Pull stored information
    overall_stats = player.inhouse_stats.overall_stats;
    recent_data = player.inhouse_stats.recent_data;
  }

  // Finish output
  const image_url = client.users.get(player.userid).avatarURL;
  const final_outputs = format_output(overall_stats, recent_data);

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
        "value": final_outputs.stats_output
      },
      {
        "name": "Recent Matches",
        "value": final_outputs.recent_matches_output,
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

function format_output(overall_stats, recent_data) {
  const stats_output = "**KDA:**   " +
    overall_stats.average_KDA.kills + " / " +
    overall_stats.average_KDA.deaths + " / " +
    overall_stats.average_KDA.assists + "\n" +
    "**W/L:**   " + overall_stats.win_percent + "%\n" +
    "**Games:**   " + overall_stats.num_games;

  var recent_matches_output = "";
  for(key in recent_data.recent_matches) {
    const match = recent_data.recent_matches[key];
    recent_matches_output += match.matchid + " | " + match.champ_emoji_icon + " " + (match.win ? "**W**" : "**L**") + " - " + match.champion_name + ": " + match.KDA.kills + " / " + match.KDA.deaths + " / " + match.KDA.assists + "\n";
  }

  return {
    stats_output: stats_output,
    recent_matches_output: recent_matches_output
  };
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

  return {
    average_KDA: {
      kills: (total_kills / inhouse_matches.length).toFixed(1),
      deaths: (total_deaths / inhouse_matches.length).toFixed(1),
      assists: (total_assists / inhouse_matches.length).toFixed(1)
    },
    win_percent: (wins / (wins + losses) * 100).toFixed(1),
    num_games: wins + losses
  };
}

function get_recent_data(champion_hash_table, inhouse_matches, userid, global_inhouse_info, client) {
  var last_champion_name;
  var recent_matches = [];
  for(key in inhouse_matches) {
    const player_data = inhouse_matches[key].players.find(a_player => a_player.userid == userid).official_data;

    // Emoji stuff
    const champ_emoji_info = global_inhouse_info.champion_icons.find(icon => icon.id == player_data.championId);
    const champ_emoji = client.emojis.get(champ_emoji_info.emoji_id);
    const champ_emoji_icon = `${champ_emoji}`;

    const champion_name = champion_hash_table[player_data.championId].name;
    const KDA = {
      kills: player_data.stats.kills,
      deaths: player_data.stats.deaths,
      assists: player_data.stats.assists
    }
    const win = player_data.stats.win;
    const matchid = inhouse_matches[key].matchid;

    recent_matches.push({
      matchid: matchid,
      win: win,
      champion_name: champion_name,
      champ_emoji_icon: champ_emoji_icon,
      KDA: KDA
    });

    last_champion_name = last_champion_name ? last_champion_name : champion_name;
  }
  return {
    recent_matches: recent_matches,
    last_champion : last_champion_name
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
