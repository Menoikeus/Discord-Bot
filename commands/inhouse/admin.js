const mongodb = require("../../mongodb/mongodb.js");
const redirector = require("../../mongodb/redirector.js");
var db;

exports.run = async (client, message, args) => {
  const is_admin = await message.member.hasPermission("ADMINISTRATOR");
	if(!is_admin) return message.channel.send('You\'re not an admin!');

  db = await mongodb.getDb();
  const directoryid = await redirector.getDirectoryId(db, message.member.guild);
  const unfinished_games = await db.db(directoryid).collection("inhouse_matches").find({ done: false }).toArray();
  if(unfinished_games.length != 0) return message.channel.send("You're not allowed to change inhouse variabless while a match is in progress!");

  if(args != null && args.length > 0)
  {
    try {
      let commandFile = require('./admin/'+args[0]+'.js');
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
}
