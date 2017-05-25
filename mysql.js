// SQL
const config = require('./config_mysql.json');

const mysql = require('mysql');
var connection = mysql.createConnection({
  host      : "localhost",
  user      : config.user,
  password  : config.password,
  database  : config.database
});

connection.connect();
/*
function(err){
  if (err)
  {
    console.log(err);
  }
}
*/

module.exports = connection;
