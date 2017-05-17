// Self explanatory

var lastHelp;
exports.run = (client, message, args) => {
	if(lastHelp != null)
	{
		lastHelp.delete();
	}

	var output = "";
	output += "__**List of commands**__\n\n" +
			  "**!ping**\t\t\t\t\t\t\t\t\t\t\t\t\t *Pings the bot*\n" +
			  "**!roll [*leftBound, rightBound*]**\t\t*Randomly chooses a number from \'leftBound\' to \'rightBound\', or from 1 to 6 if no number is specified*\n" +
			  "**!team [*names*]**\t\t\t\t\t\t\t\t *Creates two random teams based on the names*\n" +
				"**!rankedteam [*names, ranks*]**\t\t*Creates two randomly balanced teams based on the player names and their ranks*\n" +
				"**!profile [*command*]**\t\t\t\t\t\t*Calls profile-specific commands. \'!profile help\' to learn more*\n" +
				"**!changelog**\t\t\t\t\t\t\t\t\t\t*Shows the changelog*\n";

	message.channel.send(output).then(message => { lastHelp = message });
}
