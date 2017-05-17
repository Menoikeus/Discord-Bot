// roll random numbers!

exports.run = (client, message, args) => {
	if(args.length == 0)
	{
		message.channel.send('**' + Math.ceil(Math.random() * 6) + '**');
	}
	else if(args.length == 1)
	{
		message.channel.send('**' + Math.ceil(Math.random() * args[0]) + '**');
	}
	else
	{
		message.channel.send('**' + ((args[0]-1)+Math.ceil(Math.random() * (args[1] - args[0] + 1))) + '**');
	}
}
