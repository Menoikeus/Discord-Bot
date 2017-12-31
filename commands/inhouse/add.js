const lolapi = require("../../inhouse/lolapi.js");
const mongodb = require("../../mongodb/mongodb.js");
const redirector = require("../../mongodb/redirector.js");
var db;

exports.run = async (client, message, args) => {
  try {
    db = await mongodb.getDb();
    const directoryid = await redirector.getDirectoryId(db, message.member.guild);

    const name = args.join(" ");
    console.log("Trying to insert player " + name);

    // Get directory and inhouse accounts
    const user = await db.db(directoryid).collection("users").find({ userid: message.member.user.id }).toArray();
    const inhouse_user = await db.db(directoryid).collection("inhouse_players").find({ userid: message.member.user.id }).toArray();
    if(inhouse_user.length == 0) {
      try {
        const summoner = await lolapi.Summoner.gettingByName(name);

        // See if this summoner has already been registered
        const summoner_in_db = await db.db(directoryid).collection("inhouse_players").find({ leagueid: summoner.id }).toArray();
        if(summoner_in_db.length == 0) {
          const leagues = await lolapi.League.gettingPositionsForSummonerId(summoner.id);

          var info;
          var rank = -1;
          if(leagues.length == 0) {
            rank = 2;
            info = {
              "userid"	    : user[0].userid,
              "leaguename"  : summoner.name,
              "leagueid"    : summoner.id,
              "elo"         : rank
            }
          }
          else {
            // Get highest rank
            for(key in leagues) {
              var tempRank;
              switch(leagues[key].tier)
              {
                case "BRONZE"     : tempRank = 1;
                  break;
                case "SILVER"     : tempRank = 2;
                  break;
                case "GOLD"       : tempRank = 3;
                  break;
                case "PLATINUM"   : tempRank = 4;
                  break;
                case "DIAMOND"    : tempRank = 5;
                  break;
                case "MASTER"     :
                case "CHALLENGER" : tempRank = 6;
                  break;
                default           : tempRank = -1;
              }
              rank = tempRank > rank ? tempRank : rank;
            }
            info = {
              "userid"	    : user[0].userid,
              "leaguename"  : summoner.name,
              "leagueid"    : summoner.id,
              "elo"         : rank
            }
          }

          db.db(directoryid).collection("inhouse_players").insertOne(info).then( () => {
            message.reply("I've successfully added your account " + summoner.name + " with rank " + rank);
          });
        }
        else {
          message.reply("the summoner " + summoner.name + " is already tied to an account!");
        }
      }
      catch(err) {
        // See if the error occurred because the summoner doesn't exist
        // Then throw the error
        if(err.hasOwnProperty('statusCode') && err.statusCode == 404) {
            console.log("lolapi error " + err.statusCode + ": Summoner not found");
            message.reply("that summoner name does not exist!");
        }
        else {
          console.log(err);
        }
      }
    }
    else {
      message.reply("you already have a profile!");
    }
  }
  catch(err) {
    // Error catching for league api
    switch(err.statusCode) {
      case 400: console.log("lolapi error " + err.statusCode + ": Bad Request");
        message.reply("I don't know why, but something broke.");
        break;
      case 404:
        break;
      case 429: console.log("lolapi error " + err.statusCode + ": Too many requests");
        message.reply("there's been too many requests! Please try again in a moment.");
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        console.log("lolapi error " + err.statusCode + ": Server unreachable");
        message.reply("Riot's servers seem to be unreachable right now.");
        break;
      default:
        console.log(err);
    }
  }
}
