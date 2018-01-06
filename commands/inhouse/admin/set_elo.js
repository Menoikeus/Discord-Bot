const username_util = require("../../../util/username_util.js");
const mongodb = require("../../../mongodb/mongodb.js");
const redirector = require("../../../mongodb/redirector.js");
var db;

exports.run = async (client, message, args) => {
  db = await mongodb.getDb();
  const directoryid = await redirector.getDirectoryId(db, message.member.guild);

  if(!(args.length > 0)) return message.channel.send("I need an elo value followed by a discord username!");
  if(isNaN(args[0])) return message.channel.send("The first argument must be an elo value!");

  const username = args.slice(1).join(" ");
  if(username == "") return message.channel.send("The second argument must be a discord username!");

  var userid;
  try {
    userid = await username_util.get_userid(client, db, directoryid, username);
  }
  catch(err) {
    return message.channel.send(err.message);
  }

  const player = await db.db(directoryid).collection("inhouse_players").find({ userid: userid }).toArray();
  if(player.length == 0) return message.channel.send(username + " does not have an inhouse profile!");

  await db.db(directoryid).collection("inhouse_players").update(
    { userid: player[0].userid },
    { $set:
      {
        elo: Number(args[0])
      }
    }
  );

  message.channel.send("Successfully changed " + username + "'s elo from " + player[0].elo + " to " + args[0]);
}
