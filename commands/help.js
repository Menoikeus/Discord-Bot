var lastHelp;
exports.run = (client, message, args) => {
	if(lastHelp != null)
	{
		lastHelp.delete();
	}

	var output = "";
	output += "__**List of commands**__\n\n" +
			  "**!ping**\t\t\t\t\t\t\t\t   *Pings the bot*\n" +
			  "**!roll [*number*]**\t\t\t\t  *Randomly chooses a number from 1 to \'number\', or from 1 to 6 if no number is specified*\n" +
			  "**!team [*names*]**\t\t\t\t*Creates two random teams based on the names*\n" +
				"**!profile [*command*]**\t\t*Calls profile-specific commands. \'!profile help\' to learn more*\n";

	message.channel.send(output).then(message => { lastHelp = message });
}
