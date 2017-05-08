// SQL
const mysql = require('mysql');
var connection = mysql.createConnection({
  host      : "localhost",
  user      : "Kami",
  password  : "unknown",
  database  : "kami_db"
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
