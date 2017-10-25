// this is used to change the player's profile placard
const Jimp = require("jimp");
var path = require('path');
var appDir = path.dirname(require.main.filename);
const db = require(appDir + "/mysql.js");

exports.run = (client, message, args) => {
  if(args.length > 0) {
    Jimp.read(args[0], function (err,bgImage) {
      if(err)
      {
        message.channel.send(message.member + ", I think your url is invalid!");
      }
      else
      {
        bgImage.resize(500,225);
        bgImage.write(appDir + "/profile/images/" + message.member.user.id + ".jpeg");
        message.channel.send(message.member + ", I've changed your profile background!");
      }
    });
  }
  else {
    message.channel.send(message.member + ", you've got to give me a url!");
  }
}
