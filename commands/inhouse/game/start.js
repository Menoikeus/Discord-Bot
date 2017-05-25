const fs = require("fs");                 // ???
const path = require('path');
const appDir = path.dirname(require.main.filename);
const db = require(appDir + "/mysql.js");
const lolClient = require(appDir + "/lolapi.js");
const schedule = require('node-schedule');

exports.run = (client, message, args) => {
  db.query("SELECT * FROM inhouse_league_players WHERE userid="+message.member.user.id, function(error, results, fields) {
    if(error) {
      console.log(error);
    }
		else if(results.length == 0)
		{
      message.reply("you're not in the league! Use 'league add $USERNAME' to add your summoner!");
    }
    else {
      lolClient.getCurrentGame(results[0].leagueid, 'na', function(error, data) {
        if( error ) {
          message.reply("you're not currently in an inhouse game");
        }
        else {
          console.log(data);

          var totalPlayers = Object.keys(data.participants).length;
          //if(totalPlayers < 4) {
          //  message.reply("you need at least four players in your inhouse game to be considered official!");
          //}
          //else {
            db.query("SELECT * FROM inhouse_league_players", function(error, results, fields) {
              var numInLeague = 0;
              for(key in data.participants) {
                var id = data.participants[key].summonderId;
                for(var player in results)
                {
                  if(id == player.leagueid)
                  {
                    numInLeague++;
                  }
                }
              }

              if(numInLeague >= Math.floor(totalPlayers/2)+1)
              {
                // write gamedata to file if one doesn't exist
                if(fs.existsSync(appDir + "/commands/inhouse/game/game.txt")) {
                  message.reply("an inhouse game is currently in progress!");
                }
                else {
                  fs.writeFile(appDir + "/commands/inhouse/game/game.txt", JSON.stringify(data), function(error) {
                    if(error) {
                      console.log("error");
                    }
                    else {
                      console.log("START");
                      var checker = schedule.scheduleJob('*/30 * * * * *', function() {
                        lolClient.getMatch(data.gameId, 'na', function(error, match_data) {
                          if(error) {
                            console.log("Match complete!");
                            fs.readFile(appDir + "/commands/inhouse/game/game.txt", "utf8", function(error, actual_match_data) {
                              var game = JSON.parse(actual_match_data);

                              fs.unlink(appDir + "/commands/inhouse/game/game.txt", function(error){
                                if(error) { console.log("error deleting file"); }
                              });
                            });
                            checker.cancel();
                          }
                          console.log(match_data);
                        });
                      });
                    }
                  });
                }
              }
              else {
                message.reply("more of the players in your game must be registered as inhouse members. Please ask them to register now!");
              }
            });
          //}
        }

      });
    }
  });
}
