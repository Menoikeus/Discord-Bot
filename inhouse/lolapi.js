const config = require('./config_lolapi.json');

const LeagueJS = require('leaguejs');
const lolapi = new LeagueJS(config.apiKey);

module.exports = lolapi;
