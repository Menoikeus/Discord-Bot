var fs = require('fs');

var lastListing = {};
var lastComing;
exports.run = (client, message, args) => {
  var attendees = [];
  var cants = [];

  if(fs.existsSync("./occasions/"+args[0]+"_occasion.json"))
	{
		var event = require("../occasions/"+args[0]+"_occasion.json");

    fs.readFile('./occasions/attendance/'+args[0]+'_attendees.txt', 'utf8', function(err, read_attendees) {
    fs.readFile('./occasions/attendance/'+args[0]+'_cants.txt', 'utf8', function(err, read_cants) {
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
      if (args[1] == "yes") {
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
      else if (args[1] == "no") {
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
            "text": "'!coming " + args[0] + " yes' or '!coming " + args[0] + " no' to say if you're coming!"
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

        var numId = parseInt(args[0]);
        if(lastListing[numId] != null)
      	{
      		lastListing[numId].delete();
      	}
        message.channel.send({ embed }).then(message => { lastListing[numId] = message });

        stateChange = 0;
      }

      if(stateChange == 1)
      {
        var attendees_list = attendees.join("\n");
        var cants_list = cants.join("\n");
        fs.writeFile("./occasions/attendance/"+args[0]+"_attendees.txt", attendees_list, function(err) {
          if(err) console.log(err);
          console.log("File saved");
        });
        fs.writeFile("./occasions/attendance/"+args[0]+"_cants.txt", cants_list, function(err) {
          if(err) console.log(err);
          console.log("File saved");
        });
      }
    }); // read file closers
    });
  }
  else {
    fs.readdir("./occasions/", function(err, filenames) {
      if(err) console.log(err);

      for(var i = filenames.length-1; i >= 0; i--)
      {
        if(filenames[i].indexOf("occasion") == -1)
        {
          filenames.splice(i, 1);
        }
      }

      Promise.all(filenames.map(function(name) {
        return require("../occasions/"+name);
      })).then(data => {
        for(var i = 0; i < data.length; i++)
        {
          for(var j = i; j < data.length; j++)
          {
            var date1 = data[i].date.split("-");
            var date2 = data[j].date.split("-");
            if(new Date(date2[0], date2[1], date2[2]) < new Date(date2[0], date2[1], date2[2]))
            {
              var temp = data[j];
              data[i] = data[j];
              data[j] = temp;
            }
          }
        }

        var fieldlist = [];
        var count = 0, events_registered = 0;
        var current_date = new Date();
        while(count < data.length && events_registered < 3)
        {
          var date = data[count].date.split("-");
          var current_date = new Date(current_date.getFullYear(), current_date.getMonth(), current_date.getDate());
          if(!(current_date > new Date(date[0], date[1]-1, date[2])))
          {

            fieldlist.push(
              {
                "name": data[count].id + ": " + data[count].name,
                "value": data[count].description
              }
            );
            events_registered++;
          }
          count++;
        }

        var embed = {
          "title": "Upcoming events",
          "color": 612041,
          "footer": {
            "text": "'!coming [id]' to see who's coming, or go to the announcements channel for details!"
          },
          "fields": fieldlist
        }
        if(lastComing != null)
      	{
      		lastComing.delete();
      	}
        message.channel.send({ embed }).then(message => { lastComing = message });
      });
    });
  }
  message.delete();
}
