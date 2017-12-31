// this is used to generate random teams based on ranking, such that the teams are balaned

exports.run = (client, message, args) => {
	const teamMembers = args;

  var threshold = 3;    // represents how different the teams can be in rank
  if(!isNaN(args[0])) {  // if the user specifies a custom threshold, set it
    threshold = parseInt(args[0])
    args = args.slice(1);
  }

  // max team sizes
	const blueMax = Math.ceil((args.length/2)/2.);
	const redMax = Math.ceil((args.length/2)/2.);

  // make a dictionary of player ranks
  var playerRanks = {};
  var players = [];
  for(var i = 0; i < args.length/2; i++) {
    playerRanks[args[2*i]] = args[2*i+1];
    players[i] = args[2*i];
  }

	// number of tries
	var numTries = 0;
  // two teams and balance boolean
	var blue = [];
	var red = [];
  var balanced = 0;
  do {
    blue = [];
    red = [];

    bMax = blueMax;
    rMax = redMax;

    // same as in !team, randomly place players in until full
  	for(var i = 0; i < players.length; i++) {
  		var teamRand = Math.floor(Math.random() * 2);

  		if(teamRand == 0) {
  			if(bMax > 0) {
  				blue.push(players[i]);
  				bMax--;
  			}
  			else {
  				red.push(players[i]);
  				rMax--;
  			}
  		}
  		else {
  			if(rMax > 0) {
  				red.push(players[i]);
  				rMax--;
  			}
  			else {
  				blue.push(players[i]);
  				bMax--;
  			}
  		}
  	}

    // However, here, added up the ranks and then compare to see if the teams are fair
    var sumBlue = 0;
    var sumRed = 0;
    for(var b = 0; b < blue.length; b++) {
      sumBlue += parseInt(playerRanks[blue[b]]);
    }
    for(var r = 0; r < red.length; r++) {
      sumRed += parseInt(playerRanks[red[r]]);
    }

    if(Math.abs(sumRed-sumBlue) <= threshold) {
      balanced = 1;
    }
		numTries++;
  } while(!balanced && numTries < 1000);

	if(!balanced) {
		message.reply("it's too hard to make teams out of these players! Could you change the rankings or increase the threshold?");
	}
	else {
	  // OUTPUT!
		var output = "";
		output += "__**Team 1:**__\n";
		for(var i = 0; i < blue.length; i++) {
			output += "*" + blue[i] + "*\n";
		}

		output += "\n__**Team 2:**__\n";
		for(var i = 0; i < red.length; i++) {
			output += "*" + red[i] + "*\n";
		}

		message.channel.send(output);
	}
}
