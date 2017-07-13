var path = require('path');
var appDir = path.dirname(require.main.filename);
var fs = require('fs');
const event = require(appDir + "/occasions/occasion_embed.json");

var lastListing;
exports.run = (client, message, args) => {
  var attendees = [];
  var cants = [];

  fs.readFile(appDir + '/occasions/current_attendees.txt', 'utf8', function(err, read_attendees) {
  fs.readFile(appDir + '/occasions/current_cants.txt', 'utf8', function(err, read_cants) {
    if(err) console.log(err);

    attendees = read_attendees.split("\n");
    cants = read_cants.split("\n");
    if(attendees[0].trim().length == 0) {
      attendees = attendees.slice(1);
    }
    if(cants[0].trim().length == 0) {
      cants = cants.slice(1);
    }

    var stateChange = 1;
    if (args == "yes") {
      if(!attendees.includes(message.member.user.username)) {
        if(!cants.includes(message.member.user.username)) {
          message.channel.send("Ok, " + message.member.user + ", I'll see you there!");
        }
        else {
          cants.splice(cants.indexOf(message.member.user.username),1);
          message.channel.send("Oh, " + message.member.user + ", you changed your mind! I'll see you there!");
        }
        attendees.push(message.member.user.username);
      }
      else {
        message.channel.send("Wait, " + message.member.user + ", you already told me you were coming!");
      }
    }
    else if (args == "no") {
      if(!cants.includes(message.member.user.username)) {
        if(!attendees.includes(message.member.user.username)) {
          message.channel.send("Aw, " + message.member.user + ", tell me if you change your mind!");
        }
        else {
          attendees.splice(attendees.indexOf(message.member.user.username),1);
          message.channel.send("Aw, " + message.member.user + ", you said you were coming...");
        }
        cants.push(message.member.user.username);
      }
      else {
        message.channel.send("Wait, " + message.member.user + ", you already told me you weren't coming...?");
      }
    }
    else {
      var cants_list = cants.join("\n");
      var embed = {
        "title": "Attendees of the " + event.name,
        "description": event.description,
        "color": 612041,
        "footer": {
          "text": "'!coming yes' or '!coming no' to say if you're coming!"
        },
        "thumbnail": {
          "url": event.icon
        },
        "fields": [
          {
            "name": "Coming",
            "value": attendees.length != 0 ? attendees.join("\n") : "-",
            "inline": true
          },
          {
            "name": "Not",
            "value": cants.length != 0 ? cants.join("\n") : "-",
            "inline": true
          }
        ]
      }

      if(lastListing != null)
    	{
    		lastListing.delete();
    	}
      message.channel.send({ embed }).then(message => { lastListing = message });
      message.delete();

      stateChange = 0;
    }

    if(stateChange == 1)
    {
      var attendees_list = attendees.join("\n");
      var cants_list = cants.join("\n");
      fs.writeFile(appDir + "/occasions/current_attendees.txt", attendees_list, function(err) {
        if(err) console.log(err);
        console.log("File saved");
      });
      fs.writeFile(appDir + "/occasions/current_cants.txt", cants_list, function(err) {
        if(err) console.log(err);
        console.log("File saved");
      });
    }
  }); // read file closers
  });
}
