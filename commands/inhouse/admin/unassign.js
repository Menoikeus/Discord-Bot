const mongodb = require("../../../mongodb/mongodb.js");
const redirector = require("../../../mongodb/redirector.js");
var db;

exports.run = async (client, message, args) => {
  db = await mongodb.getDb();
  const directoryid = await redirector.getDirectoryId(db, message.member.guild);

  if(!(args.length > 0)) return message.reply("you need to give me a user's discord username!");

  const username = args.slice(1).join(" ");
  if(username == "") return message.channel.send("The second argument must be a discord username!");

  var userid;
  try {
    userid = await username_util.get_userid(client, db, directoryid, username);
  }
  catch(err) {
    return message.channel.send(err.message);
  }

  const player_userid = userid;
  const player = await db.db(directoryid).collection("inhouse_players").find({ userid: player_userid }).toArray();
  if(player.length == 0) return message.reply("that user does not have an inhouse profile!");

  await db.db(directoryid).collection("inhouse_players").update(
    { userid: player[0].userid },
    { $unset:
      {
        leagueid    : ""
      }
    }
  );

  message.reply("the user " + username + "'s inhouse account is now no longer linked with any summoner");
}
