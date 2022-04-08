/**
 *  Arhivo para realizar la conexión a una base de datos MySQL.
 *  Los datos con las credenciales se obtienen desde el archivo "MysqlCredentials.json".
 *  
 */

const mysql = require('mysql'); // Se importa el package para utilizar mysql
const fs = require('fs');

let data = fs.readFileSync('src/files/MysqlCredentials.json'); /** Se extraen las credenciales para acceder a Mysql desde el archivo json */
const dbHost = JSON.parse(data).host;
const dbUser = JSON.parse(data).user;
const dbPassword = JSON.parse(data).password;
const dbDataBase = JSON.parse(data).database;
/* Se crea la conección a la base de datos con las credenciales correspondientes */


const MysqlConnection = mysql.createConnection({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    database:dbDataBase
})
 /* Se crea una función para hacer la conección y mostrar los posibles errores */
MysqlConnection.connect(function (err){
    if(err){
        console.log(err);
        return;
    } else{
        console.log("Base de datos Conectada");
        
    }
});


module.exports = MysqlConnection;