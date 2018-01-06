exports.run = async (client, message, args) => {
  const is_admin = await message.member.hasPermission("ADMINISTRATOR");
	if(!is_admin) return message.reply('you\'re not an admin!');

  if(args != null && args.length > 0)
  {
    try {
      let commandFile = require('./admin/'+args[0]+'.js');
      commandFile.run(client, message, args.slice(1));
    }
    catch(err) {
      if(err.hasOwnProperty("code") && err.code == "MODULE_NOT_FOUND") {
    		console.error("No command with name " + args[0]);
      }
      else {
        console.log(err);
      }
    }
    return;
  }
}
