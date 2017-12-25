var path = require('path');
var appDir = path.dirname(require.main.filename);
const fs = require("fs");

exports.run = (client, message, args) => {
	if(fs.existsSync(appDir + "/occasions/"+args+"_occasion.json"))
	{
		var occasion = require(appDir + "/occasions/"+args+"_occasion.json");
		var embed = occasion.embed;
		message.guild.channels.find("name","announcements").send({ embed });
		message.delete();
	}
}
