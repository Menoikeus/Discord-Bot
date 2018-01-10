 const onGuildMemberAdd = require("../events/guildMemberAdd");
const mongodb = require("../mongodb/mongodb.js");
const redirector = require("../mongodb/redirector.js");
var db;

exports.run = async (client, guild) => {
	db = await mongodb.getDb();

	var servers = await db.db("kami_db").collection("servers").find({ serverid: guild.id }).toArray();
	if (servers.length == 0) {
		// Create a new directory for this server
		const server = {
			servername: guild.name,
			serverid: guild.id,
			directoryid: guild.id
		}
		const serverObj = await db.db("kami_db").collection("servers").insertOne(server);

		// inserting directory-specific information
		const directory_info = {
			info_type : "directory_info",
			s_prefix	:	"k!",
			associated_servers: [{
				$ref: "servers",
				$id:   serverObj.insertedId,
				$db:   "kami_db"
			}]
		}
		await db.db(guild.id).collection("info").insertOne(directory_info);
		const inhouse_info = {
			info_type          	  : "inhouse_info",
			start_date 						: (new Date()).getTime(),
			i_volatility_constant : Number(400),
			i_minimum_players     : Number(5),
			i_default_elo         : Number(2500),
			b_anyone_can_reassign : false,
			b_same_starting_rank  : true
		}
		await db.db(guild.id).collection("info").insertOne(inhouse_info);

		console.log('New server ID: ' + guild.id + ' added');
	}

	// Add all missing members to the directory
	await guild.members.forEach(async function(member) {
		await onGuildMemberAdd.run(client, member);
	});
};
