const mongodb = require("../../../mongodb/mongodb.js");
const redirector = require("../../../mongodb/redirector.js");
const table_maker = require("../../../util/table_util.js");
var db;

exports.run = async (client, message, args) => {
  db = await mongodb.getDb();
  const directoryid = await redirector.getDirectoryId(db, message.member.guild);

  const inhouse_info = await db.db(directoryid).collection("info").findOne({ info_type: "inhouse_info" });
  var vars = [];
  var values = [];
  for(key in inhouse_info) {
    if(key.substring(0,2) == "b_") {
      vars.push(key);
      values.push(inhouse_info[key]);
    }
  }
  if(!(args.length == 1)) return message.channel.send("I need a variable name! Here are the variables:" + await table_maker.create_table(vars, values, 7, 30));
  if(inhouse_info[args[0]] === undefined) return message.channel.send("That variable does not exist!");

  const current_value = inhouse_info[args[0]];
  await db.db(directoryid).collection("info").update(
    { info_type: "inhouse_info" },
    { $set:
      {
        [args[0]]: !current_value
      }
    }
  );

  message.channel.send("Successfully changed the value of " + args[0] + " from " + inhouse_info[args[0]] + " to " + !current_value);
}
