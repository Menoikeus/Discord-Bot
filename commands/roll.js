exports.run = (client, message, args) => {
	if(info.length == 1)
	{
		message.channel.send('**' + Math.ceil(Math.random() * 6) + '**');
	}
	else
	{
		message.channel.send('**' + Math.ceil(Math.random() * args[0]) + '**');
	}
}