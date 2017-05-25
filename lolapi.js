// League of Legends API
/*const config = require('./config_lolapi.json');

const lol = require('lol-js');
var lolClient = lol.client({
  apiKey: config.apiKey,
  cache:  null
});

module.exports = lolClient;*/

/*
const config = require('./config_lolapi.json');

var riotApi = require("riot-api-nodejs");
var classicApi = riotApi.ClassicApi([config.apiKey], riotApi.region_e.EUW);

module.exports = classicApi;*/
const config = require('./config_lolapi.json');

var lolapi = require('leagueapi');
lolapi.init(config.apiKey, 'na');

module.exports = lolapi;
