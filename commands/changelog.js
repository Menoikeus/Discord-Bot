// Self explanatory
const fs = require('fs');

exports.run = (client, message, args) => {
	const output = fs.readFileSync('changelog.txt', 'utf8');

	message.channel.send(output);
}
