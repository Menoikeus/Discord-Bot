const request = require('request');
const mongodb = require("../mongodb/mongodb.js");
const redirector = require("../mongodb/redirector.js");
var db;

exports.run = async (client, message, args) => {
  db = await mongodb.getDb();
  const global_inhouse_info = await db.db("kami_db").collection("global_info").findOne({ info_type: "league_api_info" });
  var data_dragon_champion_list = await get_json_data_from_url("http://ddragon.leagueoflegends.com/cdn/" + global_inhouse_info.i_data_dragon_version + "/data/en_US/champion.json");


  const emoji = await client.guilds.get('400538292015202305').createEmoji("./commands/blank.png", "blank");
  console.log(emoji);
/*
  const servers = ['400534746037223425',
  '400538003002359819',
  '400538292015202305']

  data_dragon_champion_list = data_dragon_champion_list.data;
  console.log(data_dragon_champion_list);
  var counter = 0;
  for(key in data_dragon_champion_list) {
    if(counter > 48){
      console.log(data_dragon_champion_list[key]);
      const emoji = await client.guilds.get(servers[Math.floor(counter / 49)]).createEmoji("http://ddragon.leagueoflegends.com/cdn/7.24.2/img/champion/"+data_dragon_champion_list[key].id+".png", data_dragon_champion_list[key].id);
      const emoji_json = {
        stripped_name: data_dragon_champion_list[key].id,
        name: data_dragon_champion_list[key].name,
        id:  data_dragon_champion_list[key].key,
        emoji_id: emoji.id
      }

      await db.db("kami_db").collection("global_info").update(
        { info_type: "league_api_info" },
        { $push:
          { champion_icons: emoji_json }
        }
      );
    }
    counter++;
  }*/
}


function get_json_data_from_url(url) {
  return new Promise((resolve, reject) => {
    request({
      url: url,
      json: true
    }, function(err, response, body) {
      if(err) throw err;
      resolve(body);
    });
  });
}
