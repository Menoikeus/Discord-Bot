// this is used to change the player's profile placard
const Jimp = require("jimp");
const mongodb = require("../../mongodb/mongodb.js");
const redirector = require("../../mongodb/redirector.js");
var db;

exports.run = async (client, message, args) => {
  db = await mongodb.getDb();
  directoryid = await redirector.getDirectoryId(db, message.member.guild);

  if(args.length > 0) {
    Jimp.read(args[0], function (err,bgImage) {
      if(err)
      {
        message.channel.send(message.member + ", I think your url is invalid!");
      }
      else
      {
        bgImage.resize(500,225);
        bgImage.write("./profile/images/" + directoryid + "/" + message.member.user.id + ".jpeg");
        message.channel.send(message.member + ", I've changed your profile background!");
      }
    });
  }
  else {
    message.channel.send(message.member + ", you've got to give me a url!");
  }
}
