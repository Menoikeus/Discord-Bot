const path = require('path');
const appDir = path.dirname(require.main.filename);
const db = require(appDir + "/mysql.js");
const lolClient = require(appDir + "/lolapi.js");

function getOnly(obj) {
    for (var a in obj) return a;
}

exports.run = (client, message, args) => {
  var name = args.join(" ");
  console.log("Trying to insert player " + name);

  db.query("SELECT * FROM inhouse_league_players WHERE userid="+message.member.user.id, function(error, results, fields) {
    if(error) {
      console.log(error);
    }
		else if(results.length == 0)
		{
      lolClient.Summoner.getByName(name, function(error, data){
        if(error) {
          message.reply("that summoner name does not exist!");
        }
        else {
          summoner = data[name.replace(/\s+/g, '').toLowerCase()];

          // find league
          var info;
          var rank = -1;
          lolClient.getLeagueData(summoner.id, function(error, rank_data) {
            if(error) {
              rank = 2;
              info = {
                "userid"	    : message.member.user.id,
                "leaguename"  : summoner.name,
                "leagueid"    : summoner.id,
                "elo"         : rank
              }
            }
            else {
              // get highest rank
              for(key in rank_data[summoner.id])
              {
                console.log(rank_data[summoner.id][key].queue);

                var tempRank;
                switch(rank_data[summoner.id][key].tier)
                {
                  case "BRONZE"     : tempRank = 1;
                    break;
                  case "SILVER"     : tempRank = 2;
                    break;
                  case "GOLD"       : tempRank = 3;
                    break;
                  case "PLATINUM"   : tempRank = 4;
                    break;
                  case "DIAMOND"    : tempRank = 5;
                    break;
                  case "MASTER"     :
                  case "CHALLENGER" : tempRank = 6;
                    break;
                  default           : tempRank = -1;
                }
                rank = tempRank > rank ? tempRank : rank;
              }

              info = {
                "userid"	    : message.member.user.id,
                "leaguename"  : summoner.name,
                "leagueid"    : summoner.id,
                "elo"         : rank
              }
            }

            console.log(info);
            db.query("INSERT INTO inhouse_league_players SET ?", info, function(error) {
      				if(error) { console.log(error) }
            });

            // latest season stuff
            db.query("SELECT * FROM inhouse_league_seasons", function(error, results, fields) {
              if(error) { console.log(error); }
              else {
                season_info = {
                  "userid"	    : message.member.user.id
                }
                db.query("INSERT INTO inhouse_league_season"+results[results.length-1].seasonnumber+"_data SET ?", season_info, function(error) {
          				if(error) { console.log(error) }
                });
              }
            });


            message.reply("I've successfully added your account " + name + " with rank " + rank);
          });

        }
      });
		}
		else {
			message.reply("you already have a profile!");
		}
  });

}
