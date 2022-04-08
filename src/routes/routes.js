/**
 *  Archivo con las rutas para el funcionamiento de la API
 * 
 */

/** SE IMPORTAN LOS ELEMENTOS NECESARIOS PARA EL FUNCIONAMIENTO DE ESTE SCRIPT */
const { Router } = require("express");
const { google } = require("googleapis");
const router = Router();
const MysqlConnection = require("../DatabaseConection.js");
const fs = require("fs");
const path = require("path");
const res = require("express/lib/response");
const { file } = require("googleapis/build/src/apis/file");
const { Console } = require("console");
const multer = require("multer");
const mimeTypes = require("mime-types");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

/**Se declaran variables, cosntantes generales para el funcionamiento */
let data = fs.readFileSync("src/files/DriveAccess1.json");
const ClientID = JSON.parse(data).web.client_id;
const ClientSecret = JSON.parse(data).web.client_secret;
const RedirectUri = JSON.parse(data).web.redirect_uris;
let TokenDrive = fs.readFileSync("src/files/RefreshToken.json");
const RefreshToken = JSON.parse(TokenDrive).RefreshToken;
const oauth2Client = new google.auth.OAuth2(
  ClientID,
  ClientSecret,
  RedirectUri
);

/**Se crea el cliente para la API de Google Drive */
oauth2Client.setCredentials({ refresh_token: RefreshToken });
const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
}); 

/**Función para generar la URL del archivo que se almacenó en google drive.
 *  se pasa como parametro el ID del archivo que se quiere conocer la url.
 *  el parametro "role" se establece "reader" que indica que el archivo solo puede ser consultado para lectura.
 *  el parametro "type" indica que cualquiera con el link devuelto puede acceder al archivo.
 *  el parametro "webViewLink" es utilizado para que la API regrese la url del archivo.
 *  el parametro "WerbContentLink" es utilizao para que la API regresé una url para descarga directa.
 */
async function generatePublicUrl(fileIdv) {
  try {
    await drive.permissions.create({
      fileId: fileIdv,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
    const result = await drive.files.get({
      fileId: fileIdv,
      fields: "webViewLink, webContentLink",
    });
    let driveUrl1 = result.data.webViewLink;
    return result.data.webViewLink;
  } catch (error) {
    console.log(error.message);
  }
}

/** Funcíon para subir los archivos del solicitante a Google Drive.
 *  Se pasa como parametros la ruta del archivo de manera local y el nombre con el que se va guardar en drive.
 *  el parametro "mimeType" indica que tipo de archivo se va subir, en caso de subir archivos distintos a pdf, se debe hacer el cambio correspondiente.
 * 
 */
async function uploadfile(RutaArchivo, NombreArchivo) {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: NombreArchivo + ".pdf",
        mimeType: "application/pdf",
      },
      media: {
        mimeType: "application/pdf",
        body: fs.createReadStream(RutaArchivo),
      },
    });
    if (response) {
      let ReturnedFileId = response.data.id;
      let driveUrl = "";
      fs.unlinkSync(RutaArchivo, function (err) {
        if (err) throw err;
      });
      return await generatePublicUrl(ReturnedFileId);
    }
  } catch (err) {
    console.log("Se encontró un error", +err);
  }
}
/** Función de Multer para recibir los archivos desde el frontend y almacenarlos de manera temporal en el servidor para almacenarlos en Drive posteriormente*/
const storage = multer.diskStorage({
  destination: "src/Pdf_Files",
  filename: function (req, file, cb) {
    cb(
      "",
      Date.now() + file.fieldname + "." + mimeTypes.extension(file.mimetype)
    );
  },
});

const LocalUpload = multer({
  storage: storage,
});

/** constante donde se indica la cantidad de archivos que se esperan, en caso de esperar más archivos, se debe modificar el tamaño del arreglo
 *  el parametro "name" hace referencia al tag "name" del formulario del frontend, ambos parametros deben coincidir en nombre tomando en cuenta mayusculas y minusculas 
 *  Ejemplo de un tag en frontend: <input type="file" name="Archivo1" id ="Archivo1"> 
*/
const MultipleUpload = LocalUpload.fields([
  { name: "Archivo1" },
  { name: "Archivo2" },
  { name: "Archivo3" },
  { name: "Archivo4" },
  { name: "Archivo5" },
]);

  /** Función utilizada para conocer el tamaño del arreglo de archivos */
const getLengthOfObject = (obj) => {
  let lengthOfObject = Object.keys(obj).length;
  return lengthOfObject;
};

/** 
 * 
 * RUTAS UTILIZADAS POR LA API 
 * 
 * */


/** RUTA PARA ACCEDER A TODOS LOS USUARIOS REGISTRADOS EN LA BASE DE DATOS*/
router.get("/", (req, res) => {
  MysqlConnection.query("SELECT * FROM Solicitantes", (err, rows, fields) => {
    if (!err) {
      res.json(rows);
    } else {
      console.log(err);
    }
  });
});

/** RUTA PARA ACCEDER A UN USUARIO ESPECIFICO REGISTRADO EN LA BD*/
router.get("/:id", (req, res) => {
  const { id } = req.params;
  MysqlConnection.query(
    "SELECT * FROM Solicitantes where id = ?",
    [id],
    (err, rows, fields) => {
      if (!err) {
        res.json(rows);
      } else {
        console.log("ERROR");
        console.log(err);
      }
    }
  );
});

/** RUTA PARA REGISTRAR UN NUEVO USUARIO*/
router.post("/", (req, res) => {
  let { id, Nombre, ApellidoPaterno, ApellidoMaterno, AñoEgreso, Correo } =
    req.body;
  if (
    Nombre == "" ||
    ApellidoPaterno == "" ||
    ApellidoMaterno == "" ||
    AñoEgreso == "" ||
    Correo == ""
  ) {
    res.json({ Status: "Datos incompletos" });
  } else {
    console.log(Nombre);
    try {
      const query = "CALL SolicitantesEdit(?,?,?,?,?,?)";
      MysqlConnection.query(
        query,
        [id, Nombre, ApellidoPaterno, ApellidoMaterno, AñoEgreso, Correo],
        (err, rows, fields) => {
          if (!err) {
            res.json({ Status: "Registro Exitoso" });
          } else {
            res.json({ Status: "Registro Fallido" });
            console.log(err);
          }
        }
      );
    } catch (error) {
      console.log(error.message);
      res.json({ Status: "Registro Fallido" });
    }
  }
});

/** RUTA PARA ACTUALIZAR DATOS GENERALES DE UN USUARIO REGISTRADO */
router.put("/:id", (req, res) => {
  const { Nombre, ApellidoPaterno, ApellidoMaterno, AñoEgreso, Correo } =
    req.body;
  if (
    Nombre == "" ||
    ApellidoPaterno == "" ||
    ApellidoMaterno == "" ||
    AñoEgreso == "" ||
    Correo == ""
  ) {
    res.json({ Status: "Datos incompletos" });
  } else {
    try {
      const { id } = req.params;
      MysqlConnection.query(
        "SELECT * FROM Solicitantes where id = ?",
        [id],
        (err, rows, fields) => {
          if (!err) {
            if (!rows == "") {
              const query = "CALL SolicitantesEdit(?,?,?,?,?,?)";
              MysqlConnection.query(
                query,
                [
                  id,
                  Nombre,
                  ApellidoPaterno,
                  ApellidoMaterno,
                  AñoEgreso,
                  Correo,
                ],
                (err, rows, fields) => {
                  if (!err) {
                    res.json({ Status: "Registro Actualizado" });
                    console.log(
                      id,
                      Nombre,
                      ApellidoPaterno,
                      ApellidoMaterno,
                      AñoEgreso,
                      Correo
                    );
                  } else {
                    res.json({ Status: "Actualización Fallida" });
                    console.log(err);
                  }
                }
              );
            }
          } else {
            console.log("ERROR");
            console.log(err);
            res.json({ error: "Datos incorrectos o el usuario no existe" });
          }
        }
      );
    } catch (error) {
      res.json(error);
    }
  }
});

/** RUTA PARA ELIMINAR A UN USUARIO REGISTRADO */
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  MysqlConnection.query(
    "SELECT * FROM Solicitantes where id = ?",
    [id],
    (err, rows, fields) => {
      if (!err) {
        if (rows == "") {
          res.json({ error: "Datos incorrectos o el usuario no existe" });
        } else {
          MysqlConnection.query(
            "DELETE FROM Solicitantes where id = ?",
            [id],
            (err, rows, fields) => {
              if (!err) {
                res.json({ Status: "Registro Eliminado" });
              } else {
                res.json({ Status: "Hubo un error eliminando el registro" });
                console.log(err);
              }
            }
          );
        }
      } else {
        console.log("ERROR");
        console.log(err);
        res.json({ error: "Datos incorrectos o el usuario no existe" });
      }
    }
  );
});

/** RUTA PARA SUBIR LOS ARCHIVOS DE UN USUARIO*/
app.use(express.json());
router.post("/upload", function (req, res) {
  const FilesToDelete = [];
  MultipleUpload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      res.json(err);
    } else if (err) {
      // An unknown error occurred when uploading.
      res.json(err);
    }
    // Si la ejecución fue correcta:

    try {
      //let objeto = req.files.Archivo2;
      let objeto = req.files;
      //console.log(Object.keys(objeto));

      for (const key in objeto) {
        if (Object.hasOwnProperty.call(objeto, key)) {
          const element = objeto[key];

          //console.log(element);
          element.forEach((element2) => {
            //console.log(element2);
            let RutaArchivo = element2.path;
            let nom = element2.originalname.substring(0, 5);
            let NombreArchivo = nom + element2.fieldname;
            uploadfile(RutaArchivo, NombreArchivo);
          });
        }
      }

      res.json({ Status: "Archivos almacenados correctamente" });
    } catch (err) {
      console.log("error en: " + err);
      res.json({ Status: "ERRROR" });
    }
  });
});

/** Ruta para hacer el registro del usuario.
 * 
 * 
 */
router.post("/pruebas", MultipleUpload, function (req, response) {
  try {
    let { id, Nombre, ApellidoPaterno, ApellidoMaterno, Egreso, Correo } =
      req.body;
    let filesToSave = [];
    let objeto = req.files;
    let cantidadDeArchivos = getLengthOfObject(objeto);
    let contador = 0;
    for (const key in objeto) {
      if (Object.hasOwnProperty.call(objeto, key)) {
        const element = objeto[key];
        element.forEach((element2) => {
          let RutaArchivo = element2.path;
          let nom = element2.originalname.substring(0, 5);
          let NombreArchivo = nom + element2.fieldname;

          uploadfile(RutaArchivo, NombreArchivo).then((res) => {
            filesToSave.push(res);
            contador++;
            if (contador == cantidadDeArchivos) {
              let archivo1 = filesToSave[0];
              let archivo2 = filesToSave[1];
              let archivo3 = filesToSave[2];
              let archivo4 = filesToSave[3];
              let archivo5 = filesToSave[4];
              if (
                Nombre == "" ||
                ApellidoPaterno == "" ||
                ApellidoMaterno == "" ||
                Egreso == "" ||
                Correo == ""
              ) {
                response.json({ Status: "Datos incompletos" });
              } else {
                try {
                  const query =
                    "CALL RegistroSolicitantes(?,?,?,?,?,?,?,?,?,?,?)";
                  MysqlConnection.query(
                    query,
                    [
                      id,
                      Nombre,
                      ApellidoPaterno,
                      ApellidoMaterno,
                      Egreso,
                      Correo,
                      archivo1,
                      archivo2,
                      archivo3,
                      archivo4,
                      archivo5,
                    ],
                    (err, rows, fields) => {
                      if (!err) {
                        console.log("Registro exitoso");
                      } else {
                        console.log(err);
                        console.log("Registro fallido");
                      }
                    }
                  );
                } catch (error) {
                  console.log(error.message);
                  response.json({ Status: "Registro Fallido" });
                }
              }
              response.json({ Stauts: "usuario y archivos registrados con exito"});
            }

          });
        });
      }
    } 
  } catch (err) {
    console.log("error en: " + err);
    response.json({ Status: "ERRROR3" });
  }
});
module.exports = router;
