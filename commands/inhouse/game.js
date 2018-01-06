exports.run = (client, message, args) => {
  // if there are arguments, pass this command to the actual commands
  if(args != null && args.length > 0)
  {
    try {
      let commandFile = require('./game/'+args[0]+'.js');
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
