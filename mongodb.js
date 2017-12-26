// SQL
const config = require('./config_mongodb.json');
var MongoClient = require('mongodb').MongoClient;

var url = "mongodb://" + config.user + ":" + config.password + "@" + config.database;

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Database created!");
  var myobj = { name: "Company Inc", address: "Highway 37" };
  db.collection("users").insertOne(myobj, function(err, res) {
    if (err) throw err;
    console.log("1 document inserted");
    db.close();
  });
  module.exports = db;
});

//var connection = MongoClient.connect(url);
//var a = connection.collection("users").find({});

//module.exports = connection;
