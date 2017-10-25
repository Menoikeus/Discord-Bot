// this is used to display the user's profile placard
// also used to handle profile commands
const Jimp = require("jimp");
var path = require('path');
var appDir = path.dirname(require.main.filename);
const db = require(appDir + "/mysql.js");
const fs = require("fs");

function wordPic(word, size, font, color)
{
  var textBox = new Jimp(50 * word.length + 10, 70, function (err,image) { if(err) throw err; });
  textBox.print(font, 0, 0, word);
  textBox.autocrop(false);
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
  textBox.autocrop(false);
  textBox.resize(size, Jimp.AUTO);
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

var lastMessage = {};
exports.run = (client, message, args) => {
    // if there are arguments, pass this command to the actual commands
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

    // query for the user
    db.query("SELECT * FROM users WHERE userid="+message.member.user.id, function(error, results, fields) {
      if(error) { console.log(error); }

      // take in the profile placard
      Jimp.read('./profile/placard.png/', function (error,placard) {
        if(error) { console.log(error); }

        // here, we find what the profile placard background should be (default or database's)
        var bgPath;

        if(fs.existsSync(appDir + "/profile/images/" + message.member.user.id + ".jpeg")) {
          bgPath = appDir + "/profile/images/" + message.member.user.id + ".jpeg";
        }
        else {
          bgPath = appDir + '/profile/placard_default_bg.png/';
        }
        /*
        if(results[0].bgimage == null) {
          bgPath = appDir + '/profile/placard_default_bg.png/';
        }
        else {
          bgPath = results[0].bgimage;
        }*/

        // read the background image
        Jimp.read(bgPath, function (error,bgImage) {
          if(error) { console.log(error); }

          // resize and place on the main image
          bgImage.resize(500,225);
          bgImage.composite(placard,0,0);
          placard = bgImage;

          // user avatar or none?
          var avatarPath;
          if(message.member.user.avatarURL == null)
          {
            avatarPath = appDir + '/profile/avatar_default.png/';
          }
          else {
            avatarPath = message.member.user.avatarURL;
          }

          // read in avatar image
          Jimp.read(avatarPath, function (error,avatar) {
            if(error) { console.log(error); }

            // resize and place avatar
            avatar.resize(85, 85);
            placard.composite(avatar,59,58);

            // load font
            Jimp.loadFont(appDir + "/profile/fonts/font.fnt").then(function(font) {
              var textPlacard = new Jimp(500, 225, function (err,image) { if(err) throw err; });
              var nameText;

              // create username graphics based on username size
              // we actually might not need this complexity now
              if(results[0].username.length >= 12)
              {
                nameText = wordPicW(results[0].username, 257, font);
                textPlacard.composite(nameText, 158,84-nameText.bitmap.height/2);
              }
              else {
                nameText = wordPic(results[0].username, 25, font);
                textPlacard.composite(nameText, 158,70);
              }

              // create exp and level text
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

              roleText = wordPicW(message.member.highestRole.name,85,font,"0x" + message.member.highestRole.hexColor.slice(1).toUpperCase());
              textPlacard.composite(roleText,158,115);

              // place text
              textPlacard.opacity(.7);
              placard.composite(textPlacard, 0, 0);

              // output image!
              placard.getBuffer(Jimp.MIME_PNG, function(error,buffa)
              {
                if(error) { console.log(error); }

                // delete the last profile that the user requested, so as to reduce profile spam
                if(lastMessage[message.member.user.id] != null) {
                  lastMessage[message.member.user.id].delete();
                }
                message.channel.send({
                  files:  [{ attachment:  buffa}]
                }).then( mess => {
        					lastMessage[message.member.user.id] = mess;
        					message.delete();
        				});
              });
            });
          });
        });
      });
    });
}
