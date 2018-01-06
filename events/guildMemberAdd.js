const mongodb = require("../mongodb/mongodb.js");
const redirector = require("../mongodb/redirector.js");
var db;

exports.run = async (client, member) => {
	db = await mongodb.getDb();
	const directoryid = await redirector.getDirectoryId(db, member.guild);

  var userObj = {
    "userid"		: member.user.id,
		"level"			: 0,
		"exp"				: 0
  }

	var users = await db.db(directoryid).collection("users").find({ "userid": member.user.id }).toArray();
	if (users.length == 0) {
		await db.db(directoryid).collection("users").insertOne(userObj);
		console.log("User " + member.user.username + " has been added to directory " + directoryid);
	}
	else {
		console.log("User " + member.user.username + " is already in directory " + directoryid);
	}
};
