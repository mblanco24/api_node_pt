import express, { json } from 'express';
import fs from 'fs';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import {methods as authentication} from "./controllers/authentication.controller.js"
import redis from 'redis'

//HEDERA
/*const { Client, PrivateKey, AccountCreateTransaction, AccountBalanceQuery, Hbar, TransferTransaction } = require("@hashgraph/sdk");
require('dotenv').config();

//Create your Hedera Testnet client
const client = Client.forTestnet();



async function environmentSetup() {
    //Grab your Hedera testnet account ID and private key from your .env file
    const myAccountId = process.env.MY_ACCOUNT_ID;
    const myPrivateKey = process.env.MY_PRIVATE_KEY;

    // If we weren't able to grab it, we should throw a new error
    if (!myAccountId || !myPrivateKey) {
        throw new Error(
        "Environment variables MY_ACCOUNT_ID and MY_PRIVATE_KEY must be present"
        );
    }

    //Create your Hedera Testnet client
    const client = Client.forTestnet();

    //Set your account as the client's operator
    client.setOperator(myAccountId, myPrivateKey);

    //Set the default maximum transaction fee (in Hbar)
    client.setDefaultMaxTransactionFee(new Hbar(100));

    //Set the maximum payment for queries (in Hbar)
    client.setDefaultMaxQueryPayment(new Hbar(50));

    console.log("Client setup complete.");
}
environmentSetup();
*/

const app = express ();
//const client1 = redis.createClient();



app.use(bodyParser.json());

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

//mi api
app.get("/", (req,res) =>{
    res.send("Mi Api con Node,js!");

});

//tod los usuarios
app.get("/api/users", (req,res) => {
    const data = readData();
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');  

    res.json(data.users);

});


/*
//lectura de un solo usuario
app.get("/api/users/:id", (req,res) => {
    const data = readData();
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');  

    const id = parseInt (req.params.id);
    const user = data.users.find((user) => user.id === id);
    res.json(user);

    jwt.sign({user}, 'secretkey' ,{expiresIn: '1d'}, (err, token) => {
        res.json({
            token
        });
    });
});

*/


//agregar un usuario
app.post("/api/users", (req,res) =>{
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
    console.log(data);

    jwt.sign({newUser}, 'secretkey' ,{expiresIn: '1d'}, (err, token) => {
        res.json({
            token,
            newUser
        });
    });

});



//borrar un usuario
app.delete("/api/users/:id", (req,res) => {
    const data = readData();
    const id = parseInt(req.params.id);
    const userIndex = data.users.findIndex((user) => user.id === id);
    data.users.splice(userIndex,1);
    writeData(data);
    res.json({message: "Usuario eliminado"});
});

app.listen(3001, () => {
    console.log("Server listening on port 3001");
});



//Rutas-----------------------------------------------------

//REGISTRO_DE_USUARIO
app.post("/api/register", (req,res) =>{
    const data = readData();
    const body = req.body;
    const newUser = {
        id: data.users.length + 1,
        ...body,
    };
    data.users.push(newUser);
    writeData(data);

    jwt.sign({newUser}, 'secretkey' ,{expiresIn: '1d'}, (err, token) => {
        res.json({
            token,
            newUser,
            mensaje: "Usuario Creado - puede loguearse"

        });
    });

});
/*
app.post ("/api/posts", verifyToken, (req,res) => {
    jwt.verify(req.token , 'secretkey', (error, authData) =>{
        if(error){
            res.sendStatus(403);
        }else{
            res.json({
                mensaje: "Post fue creado",
                authData
            })
        }
    });
});*/

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
            authData
        })
    }
    });
});



//logout:

// Ruta para el logout
/*
app.post('/api/logout', verifyToken, async (req, res) => {

    jwt.verify(req.token , 'secretkey', async (error, authData) =>{
        const Token = jwt.verify(req.token, 'secretkey');
        await client.set(Token.token,'revoked');
    if (error) {
        res.json({ message: 'Cierre de sesión exitoso. Por favor, elimine el token de su almacenamiento local.' });
    }else{
        res.status(401).json({
            message: 'Token inválido'
        });
    }
});
});*/

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

  // Ruta para el logout
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

//create-token-hedera



//list-tokens-hedera

