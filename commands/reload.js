exports.run = (client, message, args) => {
	let adminRole = message.guild.roles.find("name", "Admin");
	if(!message.member.roles.has(adminRole.id)) return message.reply('you\'re not an admin!');
	if(!args || args.length < 1) return message.reply('I need a command name to reload!');
	
	delete require.cache[require.resolve('./' + args[0] + '.js')];
	message.reply('I\'ve reloaded the ' + args[0] + ' command!');
}