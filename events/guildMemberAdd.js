var path = require('path');
var appDir = path.dirname(require.main.filename);
const db = require(appDir + "/mysql.js");

exports.run = (client, member) => {
	member.guild.defaultChannel.send('Welcome to the server, ' + member + '!');

	console.log("Trying to insert player " + member.user.username);
  var info = {
    "username"	: member.user.username,
    "userid"		: member.user.id,
		"level"			: 0,
		"exp"				: 0
  }

	db.query("SELECT * FROM users WHERE userid="+member.user.id, function(error, results, fields) {
    if(error)
    {
      console.log(error);
    }
		else if(results.length == 0)
		{
			db.query("INSERT INTO users SET ?", info, function(error) {
				if(error)
				{
					console.log(error);
				}
			});
		}
		else {
			console.log("Already there! ID: " + member.user.id + " " + results[0]);
		}
  });
};
