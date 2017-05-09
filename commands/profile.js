const Jimp = require("jimp");
var path = require('path');
var appDir = path.dirname(require.main.filename);
const db = require(appDir + "/mysql.js");

function wordPic(word, size, font, color)
{
  var textBox = new Jimp(50 * word.length + 10, 70, function (err,image) { if(err) throw err; });
  textBox.print(font, 0, 0, word);
  textBox.autocrop();
  textBox.resize(Jimp.AUTO, size);
  if(color !== undefined)
  {
    var rgbaColor = Jimp.intToRGBA(parseInt(color+"FF"));
    textBox.color([
    { apply: 'red', params: [ rgbaColor.r ] },
    { apply: 'green', params: [ rgbaColor.g ] },
    { apply: 'blue', params: [ rgbaColor.b ] }
    ]);
  }
  return textBox;
}

function wordPicW(word, size, font, color)
{
  var textBox = new Jimp(50 * word.length + 10, 70, function (err,image) { if(err) throw err; });
  textBox.print(font, 0, 0, word);
  textBox.autocrop();
  textBox.resize(size, Jimp.AUTO);
  return textBox;
}

exports.run = (client, message, args) => {
    if(args != null && args.length > 0)
    {
      try{
        let commandFile = require('./profile/'+args[0]+'.js');
        commandFile.run(client, message, args.slice(1));
      }catch(err)
      {
        console.error(err);
      }
      return;
    }

    db.query("SELECT * FROM users WHERE userid="+message.member.user.id, function(err, results, fields) {
      if(err) throw err;

      Jimp.read('./profile/placard.png/', function (err,placard) {
        if(err) throw err;

        var bgPath;
        if(results[0].bgimage == null) {
          bgPath = './profile/placard_default_bg.png/';
        }
        else {
          bgPath = results[0].bgimage;
        }
        Jimp.read(bgPath, function (err,bgImage) {
          if(err) throw err;

          bgImage.resize(500,225);
          bgImage.composite(placard,0,0);
          placard = bgImage;

          Jimp.read(message.member.user.avatarURL, function (err,avatar) {
            if (err) throw err;

            // actual code
            avatar.resize(85, 85);
            placard.composite(avatar, 60,59);

            Jimp.loadFont(appDir + "/profile/fonts/font.fnt").then(function(font) {
              var textPlacard = new Jimp(500, 225, function (err,image) { if(err) throw err; });
              var nameText;
              if(results[0].username.length >= 12)
              {
                nameText = wordPicW(results[0].username, 257, font);
                textPlacard.composite(nameText, 158,84-nameText.bitmap.height/2);
              }
              else {
                nameText = wordPic(results[0].username, 25, font);
                textPlacard.composite(nameText, 158,70);
              }

              var expText = wordPic(results[0].exp + " ", 24, font);
              textPlacard.composite(expText, 435 - expText.bitmap.width,138);
              var expWordText = wordPic("exp", 15, font);
              var expWordTextOffset = (expText.bitmap.width/2+expWordText.bitmap.width/2) > expWordText.bitmap.width ?
                                      (expText.bitmap.width/2+expWordText.bitmap.width/2) :
                                      expWordText.bitmap.width;
              textPlacard.composite(expWordText, 435 - expWordTextOffset, 120);

              var levelOffset = (expWordText.bitmap.width > expText.bitmap.width ? expWordText.bitmap.width : expText.bitmap.width);
              var levelText = wordPic(results[0].level + " ", 40, font);
              textPlacard.composite(levelText, 435 - (levelOffset +levelText.bitmap.width + 15),120);
              var levelWordText = wordPic("level", 15, font);
              textPlacard.composite(levelWordText, 435 - (levelOffset + levelWordText.bitmap.width + levelText.bitmap.width + 20),120);

              console.log(message.member.highestRole.name);
              console.log("0x" + message.member.highestRole.hexColor.slice(1));
              roleText = wordPic(message.member.highestRole.name,25,font,"0x" + message.member.highestRole.hexColor.slice(1).toUpperCase());
              textPlacard.composite(roleText,158,115);

              textPlacard.opacity(.7);
              placard.composite(textPlacard, 0, 0);
              placard.getBuffer(Jimp.MIME_PNG, function(err,buffa)
              {
                if(err) throw err;
                message.channel.send({
                  files:  [{ attachment:  buffa}]
                });
              });
            });
          });
        });
      });
    });
}
