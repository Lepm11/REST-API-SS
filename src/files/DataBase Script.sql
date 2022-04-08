Create database if not exists RegistrosEgresados
use RegistrosEgresados

create table Solicitantes (
	id INT NOT NULL AUTO_INCREMENT,
    Nombre VARCHAR(50) DEFAULT NULL,
    ApellidoPaterno VARCHAR(40) DEFAULT NULL,
    ApellidoMaterno VARCHAR(40) DEFAULT NULL,
    AñoEgreso INT (5) DEFAULT NULL,
    Correo VARCHAR (50) DEFAULT NULL,
    PRIMARY KEY(id)

);

INSERT INTO Solicitantes values(1,'Luis Enrique','Pioquinto','Martínez',2022,'lepm11@hotmail.com');
SELECT *FROM Solicitantes;
DELETE FROM Solicitantes where id = 4

CREATE PROCEDURE  SolicitantesEdit(
	IN _id INT,
    IN _Nombre VARCHAR(50),
    IN _ApellidoPaterno VARCHAR(40) ,
    IN _ApellidoMaterno VARCHAR(40) ,
    IN _AñoEgreso INT (5) ,
    IN _Correo VARCHAR (50)
)

BEGIN 

	IF _id = 0 THEN
    INSERT INTO Solicitantes (Nombre, ApellidoPaterno, ApellidoMaterno, AñoEgreso, Correo) values (_Nombre, _ApellidoPaterno, _ApellidoMaterno, _AñoEgreso, _Correo);
	SET _id=last_insert_id();        
	ELSE
		UPDATE Solicitantes
        SET 
			Nombre= _Nombre,
			ApellidoPaterno = _ApellidoPaterno, 
			ApellidoMaterno = _ApellidoMaterno,
			AñoEgreso = _AñoEgreso,
			Correo = _Correo where id = _id;
    END IF;
    SELECT _id AS id;
END

