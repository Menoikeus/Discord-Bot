const lolapi = require("../../inhouse/lolapi.js");
const mongodb = require("../../mongodb/mongodb.js");
const redirector = require("../../mongodb/redirector.js");
var db;

exports.run = async (client, message, args) => {
  try {
    db = await mongodb.getDb();
    const directoryid = await redirector.getDirectoryId(db, message.member.guild);

    // concat name
    const name = args.join(" ");
    if(name.trim().length == 0) return message.channel.send("I need a summoner name to link to your account!");
    console.log("Trying to insert player " + name + " to inhouse league of directory " + directoryid);

    // Get directory account
    const user = await db.db(directoryid).collection("users").find({ userid: message.member.user.id }).toArray();

    // Get summoner
    const summoner = await lolapi.Summoner.gettingByName(name);
    // See if this summoner has already been linked
    const summoner_in_db = await db.db(directoryid).collection("inhouse_players").find({ leagueid: summoner.id }).toArray();
    if(summoner_in_db.length != 0) return message.channel.send("The summoner " + summoner.name + " is already tied to an account!");

    // Get inhouse user
    const inhouse_user = await db.db(directoryid).collection("inhouse_players").find({ userid: message.member.user.id }).toArray();
    if(inhouse_user.length != 0) {
      // See if they have a summoner linked already
      if(inhouse_user[0].leagueid === undefined) {
        await db.db(directoryid).collection("inhouse_players").update(
          { userid: message.member.user.id },
          { $set: { leagueid: summoner.id } }
        );
        message.channel.send("I've successfully linked your account with summoner " + summoner.name);
      }
      else {
        message.channel.send("You already have a summoner linked to your account! Either ask an admin to unassign your account, or use !inhouse reassign if your server allows it!");
      }
    }
    else {
      // Get inhouse info
      const inhouse_info = await db.db(directoryid).collection("info").findOne({ info_type: "inhouse_info" });

      var rank = -1;
      // See if everyone has the same starting rank (check this first so we don't make unnecessary api calls
      if(inhouse_info.b_same_starting_rank) {
        rank = inhouse_info.i_default_elo;
      }
      else {
        // Otherwise pull rank from the league servers
        const leagues = await lolapi.League.gettingPositionsForSummonerId(summoner.id);

        // Get highest rank
        for(key in leagues) {
          var tempRank;
          switch(leagues[key].tier) {
            case "BRONZE"     : tempRank = 1000;
              break;
            case "SILVER"     : tempRank = 2000;
              break;
            case "GOLD"       : tempRank = 3000;
              break;
            case "PLATINUM"   : tempRank = 4000;
              break;
            case "DIAMOND"    : tempRank = 5000;
              break;
            case "MASTER"     : tempRank
            case "CHALLENGER" : tempRank = 6000;
              break;
            default           : tempRank = -1;
          }
          rank = tempRank > rank ? tempRank : rank;
        }
        rank = rank == -1 ? inhouse_info.i_default_elo : rank;
      }
      const info = {
        "userid"	    : user[0].userid,
        "leagueid"    : summoner.id,
        "matches"     : [],
        "elo"         : rank,

      }

      // Insert the player info
      db.db(directoryid).collection("inhouse_players").insertOne(info).then( () => {
        message.channel.send("I've successfully created your account with summoner " + summoner.name + " and rank " + rank);
      });
    }
  }
  catch(err) {
    // Error catching for league api
    switch(err.statusCode) {
      case 400: console.log("lolapi error " + err.statusCode + ": Bad Request");
        message.channel.send("I don't know why, but something broke.");
        break;
      case 404: console.log("lolapi error " + err.statusCode + ": Summoner not found");
        message.channel.send("That summoner name does not exist!");
        break;
      case 429: console.log("lolapi error " + err.statusCode + ": Too many requests");
        message.channel.send("There's been too many requests! Please try again in a moment.");
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        console.log("lolapi error " + err.statusCode + ": Server unreachable");
        message.channel.send("Riot's servers seem to be unreachable right now.");
        break;
      default:
        console.log(err);
    }
  }
}
