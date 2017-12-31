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

            // If we have enough qualified players
            if(num_players_in_league >= 1) {
              const match_data = {
                matchid   : game.gameId + "",
                done      : false
              }


              await db.db(directoryid).collection("inhouse_matches").insertOne(match_data);
              message.channel.send("A new inhouse match has begun");

              var players_in_league = [];
              var checker = schedule.scheduleJob('*/30 * * * * *', async function() {
                console.log("CHECKING");
                try {
                  const finished_game = await lolapi.Match.gettingById(game.gameId);

                  var participant_stats = [];
                  var participant_userids = [];
                  console.log("1");
                  for(i in players_in_league) {
                    console.log("2");
                    const championid = players_in_league[i].championid;
                    const teamid = players_in_league[i].teamid;
                    for(j in finished_game.participants) {
                      console.log("3");
                      if(championid == finished_game.participants[j].championId && teamid == finished_game.participants[j].teamId) {
                        console.log("4");
                        await participant_stats.push({
                          userid        : players_in_league[i].userid,
                          championId    : championid,
                          official_data : finished_game.participants[j]
                        });
                        await participant_userids.push(players_in_league[i].userid);
                      }
                    }
                  }

                  console.log(finished_game);
                  console.log(participant_stats);
                  console.log(players_in_league);

                  const winners = finished_game.teams[0].win == "Fail" ? 200 : 100;
                  console.log(await db.db(directoryid).collection("inhouse_matches").find({ matchid: game.gameId }));
                  console.log("H");
                  console.log(game.gameId);
                  console.log(finished_game.gameId);
                  console.log(game);
                  await db.db(directoryid).collection("inhouse_matches").update(
                    { matchid: finished_game.gameId },
                    { $set:
                      {
                        players       :  participant_stats,
                        userids       :  participant_userids,
                        winning_team  :  winners,
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
                      console.log(directoryid);
                      //directoryid = await redirector.getDirectoryId(db, message.member.guild);
                      const inhouse_players = await db.db(directoryid).collection("inhouse_players").find({}).toArray();

                      console.log(ongoing_game);
                      console.log(inhouse_players);

                      players_in_league = [];
                      // Update current inhouse league players in game
                      // (So that you can !inhouse add while game is ongoing)
                      for(i in ongoing_game.participants) {
                        const id = ongoing_game.participants[i].summonerId;
                        for(j in inhouse_players) {
                          if(id == inhouse_players[j].leagueid) {
                            await players_in_league.push({
                              userid      : inhouse_players[j].userid,
                              championid  : ongoing_game.participants[i].championId,
                              teamid      : ongoing_game.participants[i].teamId
                            });
                          }
                        }
                      }
                      console.log(players_in_league);
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
          message.reply("I don't know why, but something broke.");
          break;
        case 404:
          break;
        case 429: console.log("lolapi error " + err.statusCode + ": Too many requests");
          message.reply("there's been too many requests! Please try again in a moment.");
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          console.log("lolapi error " + err.statusCode + ": Server unreachable");
          message.reply("Riot's servers seem to be unreachable right now.");
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
