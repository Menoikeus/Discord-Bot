// Self explanatory
var fs = require('fs');

exports.run = (client, message, args) => {
	var output = fs.readFileSync('changelog.txt', 'utf8');

	message.channel.send(output);
}
