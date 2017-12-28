exports.run = (client, message, args) => {
  // if there are arguments, pass this command to the actual commands
  if(args != null && args.length > 0)
  {
    try{
      let commandFile = require('./inhouse/'+args[0]+'.js');
      commandFile.run(client, message, args.slice(1));
    }catch(err)
    {
      console.error(err);
    }
    return;
  }

/*
  db.query("SELECT * FROM inhouse_league_seasons", function(err, results, fields)
  {
    var output =  "**In-House Season " + results[results.length-1].seasonnumber + "**\n" +
                  "*Start date: " + results[results.length-1].beginning_date + "*";
    message.channel.send(output);
  });*/
}
