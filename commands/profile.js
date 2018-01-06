// this is used to display the user's profile placard
// also used to handle profile commands
const Jimp = require("jimp");
const fs = require("fs");
const mongodb = require("../mongodb/mongodb.js");
const redirector = require("../mongodb/redirector.js");
var db;

async function wordPic(word, size, font, color)
{
  var textBox = await new Jimp(50 * word.length + 10, 70);
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

async function wordPicW(word, size, font, color)
{
  var textBox = await new Jimp(50 * word.length + 10, 70);
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
exports.run = async (client, message, args) => {
    db = await mongodb.getDb();
    const directoryid = await redirector.getDirectoryId(db, message.member.guild);

    // if there are arguments, pass this command to the actual commands
    if(args != null && args.length > 0)
    {
      try {
        let commandFile = require('./profile/'+args[0]+'.js');
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

    // query for the user
    const user = await db.db(directoryid).collection("users").find({ userid: message.member.user.id }).toArray();
    // take in the profile placard
    var placard = await Jimp.read('./profile/placard.png/');

    // here, we find what the profile placard background should be (default or database's)
    var bgPath;
    if(fs.existsSync("./profile/images/" + directoryid + "/" + message.member.user.id + ".jpeg")) {
      bgPath = "./profile/images/" + directoryid + "/" + message.member.user.id + ".jpeg";
    }
    else {
      bgPath = "./profile/placard_default_bg.png/";
    }
    // read the background image
    var bgImage = await Jimp.read(bgPath);

    // resize and place on the main image
    bgImage.resize(500,225);
    bgImage.composite(placard,0,0);
    placard = bgImage;

    // user avatar or none?
    var avatarPath;
    if(message.member.user.avatarURL == null) {
      avatarPath = './profile/avatar_default.png/';
    }
    else {
      avatarPath = message.member.user.avatarURL;
    }
    // read in avatar image
    var avatar = await Jimp.read(avatarPath);

    // resize and place avatar
    avatar.resize(85, 85);
    placard.composite(avatar,59,58);

    // load font
    const font = await Jimp.loadFont("./profile/fonts/font.fnt");
    var textPlacard = await new Jimp(500, 225);
    var nameText;

    const username = client.users.get(user[0].userid).username;
    // create username graphics based on username size
    // we actually might not need this complexity now
    if(username.length >= 12)
    {
      nameText = await wordPicW(username, 257, font);
      textPlacard.composite(nameText, 158,84-nameText.bitmap.height/2);
    }
    else {
      nameText = await wordPic(username, 25, font);
      textPlacard.composite(nameText, 158,70);
    }

    // create exp and level text
    const expText = await wordPic(user[0].exp + " ", 24, font);
    textPlacard.composite(expText, 435 - expText.bitmap.width,138);
    const expWordText = await wordPic("exp", 15, font);
    const expWordTextOffset = (expText.bitmap.width/2+expWordText.bitmap.width/2) > expWordText.bitmap.width ?
                            (expText.bitmap.width/2+expWordText.bitmap.width/2) :
                            expWordText.bitmap.width;
    textPlacard.composite(expWordText, 435 - expWordTextOffset, 120);

    const levelOffset = (expWordText.bitmap.width > expText.bitmap.width ? expWordText.bitmap.width : expText.bitmap.width);
    const levelText = await wordPic(user[0].level + " ", 40, font);
    textPlacard.composite(levelText, 435 - (levelOffset +levelText.bitmap.width + 15),120);
    const levelWordText = await wordPic("level", 15, font);
    textPlacard.composite(levelWordText, 435 - (levelOffset + levelWordText.bitmap.width + levelText.bitmap.width + 20),120);

    const roleText = await wordPicW(message.member.highestRole.name,85,font,"0x" + message.member.highestRole.hexColor.slice(1).toUpperCase());
    textPlacard.composite(roleText,158,115);

    // place text
    textPlacard.opacity(.7);
    placard.composite(textPlacard, 0, 0);

    // output image!
    placard.getBuffer(Jimp.MIME_PNG, function(error,buffa) {
      if(error) { console.log(error); }

      // delete the last profile that the user requested, so as to reduce profile spam
      if(lastMessage[message.member.guild.id] == null) {
        lastMessage[message.member.guild.id] = {};
      }
      if(lastMessage[message.member.guild.id][message.member.user.id] != null) {
        lastMessage[message.member.guild.id][message.member.user.id].delete();
      }
      message.channel.send({
        files:  [{ attachment:  buffa}]
      }).then( mess => {
				lastMessage[message.member.guild.id][message.member.user.id] = mess;
				message.delete();
			});
    });
}
