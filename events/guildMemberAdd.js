const mongodb = require("../mongodb/mongodb.js");
const redirector = require("../mongodb/redirector.js");
var db;

exports.run = async (client, member) => {
	db = await mongodb.getDb();
	directoryid = await redirector.getDirectoryId(db, member.guild);

	member.guild.defaultChannel.send('Welcome to the server, ' + member + '!');

	console.log("Trying to insert player " + member.user.username);
  var userObj = {
    "username"	: member.user.username,
    "userid"		: member.user.id,
		"level"			: 0,
		"exp"				: 0
  }

	var users = await db.db(directoryid).collection("users").find({ "userid": member.user.id }).toArray();
	if (users.length == 0) {
		db.db(directoryid).collection("users").insertOne(userObj);
	}
};
