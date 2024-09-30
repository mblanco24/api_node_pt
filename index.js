import express, { json } from 'express';
import fs from 'fs';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import {methods as authentication} from "./controllers/authentication.controller.js"
import redis from 'redis'
import cors from 'cors';

const app = express ();
//const client1 = redis.createClient();

app.use(cors({
    origin: 'http://127.0.0.1:8000'
}));


app.use(bodyParser.json());

app.listen(3001, () => {
    console.log("Server listening on port 3001");
});


//leer data
const readData = () =>{
    try{
        const data = fs.readFileSync ("./db.json");
        return JSON.parse(data);
        }catch (error) {
            console.log(error)
        }
};

//escribir data
const writeData = (data) => {
    try {
        fs.writeFileSync("./db.json", JSON.stringify(data));
    }   catch (error) {
        console.log(error);
    }
};

app.get("/", (req,res) =>{
    res.send("Mi Api con Node,js!");

});


//tods los usuarios
app.get("/api/users", (req,res) => {
    const data = readData();
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');  
    res.json(data.users);
});


//REGISTRO_DE_USUARIO
app.post("/api/register", (req,res) =>{
    const data = readData();
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');  

    const body = req.body;
    const newUser = {
        id: data.users.length + 1,
        ...body,
    };
    data.users.push(newUser);
    writeData(data);

    jwt.sign({newUser}, 'secretkey' ,{expiresIn: '40m'}, (err, token) => {
        res.json({
            token,
            newUser,
            mensaje: "Usuario Creado - puede loguearse"
        });
    });
});


// Authorization: Bearer <token> se encarga de verificar el token y si no lo recibe envia un 403 (acceso prohibido)
function verifyToken (req,res,next) {
    const bearerHeader = req.headers['authorization'];

    if(typeof bearerHeader !== 'undefined') {
        const bearerToken = bearerHeader.split(" ")[1];
        req.token = bearerToken;
        next();
    }else {
        res.sendStatus(403);
    }
}

function extractToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if ( typeof bearerHeader !== 'undefined') {
    const bearerToken = bearerHeader.split(' ')[1];
    req.token = bearerToken;
    next();
    } else {
    res.sendStatus(401);

    }
}

//LOGIN
app.post("/api/login/:id", verifyToken, (req,res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');  

    jwt.verify(req.token , 'secretkey', (error, authData) =>{
    const data = readData();
    const body = req.body;
    const id = parseInt(req.params.id);
    const userIndex = data.users.findIndex((user) => user.id === id);
    data.users[userIndex] = {
        ...data.users[userIndex],
        ...body,
    };
    writeData(data);

    if(error){
        res.sendStatus(403);
    }else{
        res.json({
            mensaje: "Logueado",
            id
        })
    }
    });
});


//LOGOUT
app.post("/api/logout", extractToken, async (req, res) => {
    try {
        const decodedToken = jwt.verify(req.token, 'secretkey');
        await client.set(decodedToken.id ,'revoked');
        res.json({
            message: 'Cierre de sesión exitoso. Por favor, elimine el token de su almacenamiento local.' 
        });
    } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
    }
});