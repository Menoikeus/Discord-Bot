const lolapi = require("../../../inhouse/lolapi.js");
const schedule = require('node-schedule');
const mongodb = require("../../../mongodb/mongodb.js");
const redirector = require("../../../mongodb/redirector.js");
var db;

exports.run = async (client, message, args) => {
  try {
    db = await mongodb.getDb();
    const directoryid = await redirector.getDirectoryId(db, message.member.guild);

    // See if there's an unfinished game pending
    const unfinished_games = await db.db(directoryid).collection("inhouse_matches").find({ done: false }).toArray();
    if(unfinished_games.length == 0) {

      // See if the player that called this command is in the inhouse league
      const player = await db.db(directoryid).collection("inhouse_players").find({ userid: message.member.user.id }).toArray();
      if(player.length != 0) {
        try {
          // Get the game the player is currently in
          const game = await lolapi.Spectator.gettingActiveGame(player[0].leagueid);

          // Check if its a custom game
          if(game.gameType == "CUSTOM_GAME") {
            var inhouse_players = await db.db(directoryid).collection("inhouse_players").find({}).toArray();

            // See if we have enough inhouse league players in the game
            var num_players_in_league = 0;
            for(i in game.participants) {
              const id = game.participants[i].summonerId;
              for(j in inhouse_players) {
                if(id == inhouse_players[j].leagueid) {
                  num_players_in_league++;
                }
              }
            }

            const inhouse_info = await db.db(directoryid).collection("inhouse_players").find({ info_type : "inhouse_info" });
            // If we have enough qualified players
            if(num_players_in_league >= inhouse_info.minimum_players) {
              const match_data = {
                matchid   : game.gameId + "",
                done      : false
              }

              await db.db(directoryid).collection("inhouse_matches").insertOne(match_data);
              message.channel.send("A new inhouse match has begun");

              var players_in_league = [];
              var checker = schedule.scheduleJob('*/30 * * * * *', async function() {
                console.log("Checking status of game " + game.gameId + " for server " + directoryid);
                try {
                  var finished_game = await lolapi.Match.gettingById(game.gameId);

                  // Add all participants to the array
                  var participant_stats = [];
                  for(j in finished_game.participants) {
                    finished_game.participants[j].is_added = false;
                    for(i in players_in_league) {
                      const championid = players_in_league[i].championid;
                      const teamid = players_in_league[i].teamid;
                      if(championid == finished_game.participants[j].championId && teamid == finished_game.participants[j].teamId) {
                        finished_game.participants[j].is_added = true;
                        participant_stats.push({
                          userid        : players_in_league[i].userid,
                          elo           : players_in_league[i].elo,
                          official_data : finished_game.participants[j]
                        });
                      }
                    }
                    if(finished_game.participants[j].is_added == false) {
                      var rank;
                      switch(finished_game.participants[j].highestAchievedSeasonTier) {
                        case "BRONZE"     : rank = 1000;
                          break;
                        case "SILVER"     : rank = 2000;
                          break;
                        case "GOLD"       : rank = 3000;
                          break;
                        case "PLATINUM"   : rank = 4000;
                          break;
                        case "DIAMOND"    : rank = 5000;
                          break;
                        case "MASTER"     :
                        case "CHALLENGER" : rank = 6000;
                          break;
                        default           : rank = 2000;
                      }

                      participant_stats.push({
                        elo           : rank,
                        official_data : finished_game.participants[j]
                      });
                    }
                  }

                  // Do winner and loser elo calculations
                  const winners = finished_game.teams[0].win == "Fail" ? 200 : 100;
                  const losers = winners == 100 ? 200 : 100;
                  const winning_players = participant_stats.filter(participant => participant.official_data.teamId == winners);
                  const losing_players = participant_stats.filter(participant => participant.official_data.teamId == losers);
                  console.log(winning_players);
                  console.log(losing_players);
                  var total_winner_elo = 0;
                  var total_loser_elo = 0;
                  for(key in winning_players) {
                    total_winner_elo += winning_players[key].elo;
                  }
                  for(key in losing_players) {
                    total_loser_elo += losing_players[key].elo;
                  }

                  const weight = 1 - (total_winner_elo / (total_winner_elo + total_loser_elo));
                  const winner_gain = weight * inhouse_info.volatility_constant;

                  for(key in winning_players) {
                    if(winning_players[key].hasOwnProperty("userid")) {
                      const elo_change = winner_gain * ((total_winner_elo - winning_players[key].elo) / (total_winner_elo * (winning_players.length - 1)));

                      console.log(winning_players[key].elo);
                      console.log(elo_change);
                      await db.db(directoryid).collection("inhouse_players").update(
                        { userid: winning_players[key].userid },
                        { $inc:
                          {
                            elo:  elo_change
                          }
                        }
                      );
                      winning_players[key].elo_delta = elo_change;
                    }
                  }
                  for(key in losing_players) {
                    var elo_change;
                    if(losing_players.length > 1) {
                      elo_change = winner_gain * (losing_players[key].elo / total_loser_elo);
                    }
                    else {
                      elo_change = winner_gain
                    }

                    console.log(losing_players[key].elo);
                    console.log(elo_change);
                    await db.db(directoryid).collection("inhouse_players").update(
                      { userid: losing_players[key].userid },
                      { $inc:
                        {
                          elo:  (-1 * elo_change)
                        }
                      }
                    );
                    losing_players[key].elo_delta = -1 * elo_change;
                  }

                  const current_time = (new Date()).getTime();
                  const query = finished_game.gameId + "";
                  await db.db(directoryid).collection("inhouse_matches").update(
                    { matchid: query },
                    { $set:
                      {
                        players       :  participant_stats,
                        winning_team  :  winners,
                        date          :  current_time,
                        done          :  true
                      }
                    });
                  message.channel.send("Inhouse game completed!");
                  checker.cancel();
                }
                catch(err) {
                  // If the game hasn't finished yet
                  if(err.hasOwnProperty('statusCode') && err.statusCode == 404) {
                    try {
                      const ongoing_game = await lolapi.Spectator.gettingActiveGame(player[0].leagueid);
                      const inhouse_players = await db.db(directoryid).collection("inhouse_players").find({}).toArray();

                      players_in_league = [];
                      // Update current inhouse league players in game
                      // (So that you can !inhouse add while game is ongoing)
                      for(i in ongoing_game.participants) {
                        const id = ongoing_game.participants[i].summonerId;
                        for(j in inhouse_players) {
                          if(id == inhouse_players[j].leagueid) {
                            await players_in_league.push({
                              userid      : inhouse_players[j].userid,
                              elo         : inhouse_players[j].elo,
                              championid  : ongoing_game.participants[i].championId,
                              teamid      : ongoing_game.participants[i].teamId
                            });
                          }
                        }
                      }
                    }
                    catch(err) {
                      // If the game looks like it hasn't finished, AND the summoner is no longer player in a game,
                      // then the game must have ended prematurely. Thus discard the match
                      if(err.hasOwnProperty('statusCode') && err.statusCode == 404) {
                        message.channel.send("Game ended prematurely! Not counting match.");
                        db.db(directoryid).collection("inhouse_matches").remove({ done: false }, true);
                        checker.cancel();
                      }
                      else {
                        console.log(err);
                      }
                    }
                  }
                  else {
                    console.log(err);
                  }
                }
              });
            }
            else {
              message.channel.send("An inhouse game must have at least 5 players in the inhouse league to be valid! Please link your accounts with summoners using !inhouse add $USERNAME");
            }
          }
          else {
            message.reply("you're not in an inhouse game right now! It needs to be a custom game");
          }
        }
        catch(err) {
          // See if the error occurred because the game doesn't exist
          // Then throw the error
          if(err.hasOwnProperty('statusCode') && err.statusCode == 404) {
              console.log("lolapi error " + err.statusCode + ": Game not found");
              message.reply("you're not in a game right now!");
          }
          else {
            console.log(err);
          }
        }
      }
      else {
        message.reply("you're not in the league! Use '!inhouse add $USERNAME' to add your summoner!");
      }
    }
    else {
      message.channel.send("An inhouse game is currently in progress!");
    }
  }
  catch(err) {
    // Error catching for league api
    if(err.hasOwnProperty('statusCode')) {
      switch(err.statusCode) {
        case 400: console.log("lolapi error " + err.statusCode + ": Bad Request");
          message.channel.send("I don't know why, but something broke.");
          break;
        case 403: console.log("lolapi error " + err.statusCode + ": Forbidden");
          message.channel.send("Looks like the api key currently isn't working. Please tell the dev.");
          break;
        case 404: console.log("lolapi error " + err.statusCode + ": Game not found");
          message.channel.send("You're not in a game right now!");
          break;
        case 429: console.log("lolapi error " + err.statusCode + ": Too many requests");
          message.channel.send("There's been too many requests! Please try again in a moment.");
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          console.log("lolapi error " + err.statusCode + ": Server unreachable");
          message.channel.send("Riot's servers seem to be unreachable right now.");
          break;
        default:
          console.log(err);
      }
    }
    else {
      console.log(err);
    }
  }
}
