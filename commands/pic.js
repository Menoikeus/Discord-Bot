const Jimp = require("jimp");
exports.run = (client, message, args) => {
  var image = new Jimp(256, 256, function (err,image) {
      if(err)
      {
        console.log(err);
      }
    });
    /*
    message.channel.send({
      file: image
    });*/
    /*message.channel.send("This is your placard!", {
      g
    });*/
}
