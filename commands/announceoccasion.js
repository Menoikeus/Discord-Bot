const fs = require("fs");

exports.run = (client, message, args) => {
	if(fs.existsSync("./occasions/"+args[0]+"_occasion.json"))
	{
		var occasion = require("../occasions/"+args[0]+"_occasion.json");
		var embed = occasion.embed;
		message.guild.channels.find("name","announcements").send({ embed });
		message.delete();
	}
}
