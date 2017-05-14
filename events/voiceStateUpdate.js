exports.run = (client, oldMember, newMember) => {
  console.log(oldMember.voiceChannel + " / " + newMember.voiceChannel);
  //if(oldMember.voiceChannel == null && newMember.voiceChannel != null)
  if(false)
  {
    var nickname = newMember.guild.members.get(client.user.id).nickname;
    newMember.guild.members.get(client.user.id).setNickname("я").then(bot => {
      newMember.guild.defaultChannel.send(newMember + " has joined the server", {
        tts:  true
      }).then(message => {
        message.delete();
        newMember.guild.members.get(client.user.id).setNickname(nickname).then(bot => {
          newMember.guild.defaultChannel.send(newMember + " has joined the server");
        });
      });
    });
  }
}
