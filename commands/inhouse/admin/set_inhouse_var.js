const mongodb = require("../../../mongodb/mongodb.js");
const redirector = require("../../../mongodb/redirector.js");
const table_maker = require("../../../util/table_util.js");
var db;

exports.run = async (client, message, args) => {
  db = await mongodb.getDb();
  const directoryid = await redirector.getDirectoryId(db, message.member.guild);

  const inhouse_info = await db.db(directoryid).collection("info").find({ info_type: "inhouse_info" }).toArray();
  var vars = [];
  var values = [];
  for(key in inhouse_info[0]) {
    if(key.substring(0,2) == "i_") {
      vars.push(key);
      values.push(inhouse_info[0][key]);
    }
  }
  if(!(args.length == 2)) return message.channel.send("I need a variable name followed by a value! Here are the variables:" + await table_maker.create_table(vars, values, 7, 30));
  if(isNaN(args[1])) return message.channel.send("The second argument must be a numerical value!");
  if(inhouse_info[0][args[0]] === undefined) return message.channel.send("That variable does not exist!");

  await db.db(directoryid).collection("info").update(
    { info_type: "inhouse_info" },
    { $set:
      {
        [args[0]]: Number(args[1])
      }
    }
  );

  message.channel.send("Successfully changed the value of " + args[0] + " from " + inhouse_info[0][args[0]] + " to " + args[1]);
}
