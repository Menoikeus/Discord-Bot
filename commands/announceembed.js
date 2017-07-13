var path = require('path');
var appDir = path.dirname(require.main.filename);
const event = require(appDir + "/occasions/occasion_embed.json");

exports.run = (client, message, args) => {
	var embed = event.embed;
	message.guild.channels.find("name","announcements").send({ embed });
	message.delete();
}
