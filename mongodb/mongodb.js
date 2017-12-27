// SQL
var MongoClient = require( 'mongodb' ).MongoClient;
const config = require('./config_mongodb.json');
var url = "mongodb://" + config.user + ":" + config.password + "@" + config.database;
var _db;

module.exports = {
  connect: function() {
    MongoClient.connect(url, function(err, db) {
      _db = db;
    });
  },
  getDb: function() {
    return _db;
  }
};

//var connection = MongoClient.connect(url);
//var a = connection.collection("users").find({});

//module.exports = connection;
