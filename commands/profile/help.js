var lastHelp;
exports.run = (client, message, args) => {
  if(lastHelp != null)
	{
		lastHelp.delete();
	}

	var output = "";
	output += "__**List of profile commands**__\n\n" +
			  "**!profile**\t\t\t\t\t\t\t  *Brings up your profile placard*\n" +
			  "**!profile image [*url*]**\t\t *Replaces profile placard background*\n";

	message.channel.send(output).then(message => { lastHelp = message });
}
