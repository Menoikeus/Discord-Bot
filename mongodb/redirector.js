const mongodb = require("./mongodb.js");
var db;

module.exports = {
  getDirectoryId: async function(db, guild) {
    db = await mongodb.getDb();
    var servers = await db.db("kami_db").collection("servers").find({ serverid: guild.id }).toArray();
    return servers[0].directoryid + "";
  }
};
