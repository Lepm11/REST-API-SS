const express = require('express');
const app = express(); //Se importa express y se almacena en la variable app.
const morgan = require('morgan'); //middlewares, procesa dantos antes de recibirlos.
const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');
const bodyParser = require('body-parser');
//Settings
app.set('PortNumber',process.env.PORT || 4000); /*Se asigna el puerto donde estará la API,
                                                 si hay un puerto definido en el servidor se asigna ese valor
                                                en caso contrario se asigna el 3000*/
app.set('json spaces',2);
//middlewares
app.use(morgan('dev')); // Muestra información de control en consola para el desarrollador.
app.use(express.urlencoded({extended : false})); 
app.use(express.json()) //Permite al servidor recibir y entender formatos JSON.


//routes
app.use(express.json());
app.use(bodyParser.urlencoded({
    extended: true
  }));
app.use(require('./routes/routes'))

//Starting the server

app.listen(app.get('PortNumber'), ()=>{
    console.log(`server on port ${app.get('PortNumber')}`);
});

