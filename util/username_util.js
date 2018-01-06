module.exports = {
  get_userid: async function(client, db, directoryid, username) {
    const number_of_hashes = (username.match(/#/g) || []).length;
    const directory_users = await db.db(directoryid).collection("users").find({}).toArray();

    if(number_of_hashes == 0) {
      const users = await directory_users.filter((d_user) => {
        user_with_id = client.users.get(d_user.userid);
        return user_with_id.username == username;
      });

      if(users.length == 0) {
        throw new Error("The username " + username + " does not exist!");
      }
      else if(users.length != 1) {
        // If there are multiple users with the same username
        var output = "";
        for(key in users) {
          const discord_user = client.users.get(users[key].userid);
          output += discord_user.username + "#" + discord_user.discriminator + "\n";
        }
        throw new Error("The there are " + users.length + " users with the username " + username + ". Please type their username followed by # and their discriminator.```" + output + "```");
      }
      else {
        return users[0].userid;
      }
    }
    else if(number_of_hashes == 1){
      const discriminator = username.split("#")[1];
      if(!isNaN(discriminator) && String(discriminator).length == 4) {
        const name = username.split("#")[0];
        const users = await directory_users.filter((d_user) => {
          user_with_id = client.users.get(d_user.userid);
          return user_with_id.username == name && user_with_id.discriminator == discriminator;
        });

        if(users.length == 0) {
          throw new Error("The username and discriminator " + username + " does not exist!");
        }
        else {
          return users[0].userid;
        }
      }
      else {
        throw new Error("The discriminator must be a four digit integer!");
      }
    }
    else {
      throw new Error("The correct format for a username and discriminator is username#discriminator");
    }
  }
}
