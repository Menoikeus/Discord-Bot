var path = require('path');
var appDir = path.dirname(require.main.filename);
const db = require(appDir + "/mysql.js");

exports.run = (client, message, args) => {
  if(args.length > 0) {
    db.query("UPDATE users SET bgimage=\'"+args[0]+"\' WHERE userid="+message.member.user.id, function(err) {
      if(err) throw err;
    });
    message.channel.send(message.member + ", I've changed your profile background!");
  }
  else {
    message.channel.send(message.member + ", you've got to give me a url!");
  }
}
