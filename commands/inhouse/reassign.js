const lolapi = require("../../inhouse/lolapi.js");
const mongodb = require("../../mongodb/mongodb.js");
const redirector = require("../../mongodb/redirector.js");
var db;

exports.run = async (client, message, args) => {
  try {
    db = await mongodb.getDb();
    const directoryid = await redirector.getDirectoryId(db, message.member.guild);

    const inhouse_info = await db.db(directoryid).collection("info").findOne({ info_type: "inhouse_info" });
    if(!inhouse_info.b_anyone_can_reassign) return message.channel.send("Reassigning is disabled! Either ask an admin to use !inhouse unassign $DISCORD_USERNAME or to enable reassigning!");

    // concat name
    const name = args.join(" ");
    if(name.trim().length == 0) return message.channel.send("I need a summoner name to reassign your account to!");
    console.log("Trying to assign summoner " + name + " to user " + message.member.user.username + " in the inhouse league of directory " + directoryid);

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
      await db.db(directoryid).collection("inhouse_players").update(
        { userid: message.member.user.id },
        { $set: { leagueid: summoner.id } }
      );
      message.channel.send("I've successfully assigned the summoner " + summoner.name + " to your account!");
    }
    else {
      message.channel.send("You don't have an inhouse account yet! Use !inhouse add $SUMMONER_NAME instead!");
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
