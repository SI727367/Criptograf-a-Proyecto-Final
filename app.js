const express = require("express");
const multer = require('multer');
const bodyParser = require('body-parser');
const JsonDB = require('node-json-db').JsonDB;
const Config = require('node-json-db/dist/lib/JsonDBConfig').Config;
const uuid = require("uuid");
const speakeasy = require("speakeasy");
const crypto = require("crypto")
const fs     = require('fs');
const Cryptr = require('cryptr');
const argon2 = require('argon2');
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048
});
const upload = multer({dest: './subidos'});
const app = express();
var alert = require('alert');

var db = new JsonDB(new Config("basededaros", true, false, '/'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/',(req, res) =>{
  res.sendFile('index.html', {root: __dirname});
});

app.post('/subida', upload.single('archivo'), (req, res) =>
{
   alert('enviado');
   res.send();
});

app.post('/mostrarenviados', (root,res)=>{
  fs.readdir('subidos', (err, files) => {
      res.send(files);
});
});

app.post("/registro", async(req, res) => {
  const id = uuid.v4();
    const path = `/user/${id}`;
    const temp_secret = speakeasy.generateSecret();
    res.json({ id, secret: temp_secret.base32 })
    db.push(path, { id, temp_secret});    
})

app.post("/sesion", (req,res) => {
  const { userId, token } = req.body;
  try {
    const path = `/user/${userId}`;
    const user = db.getData(path);
    console.log({ user })
    const { base32: secret } = user.temp_secret;
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token
    });
    if (verified) {
      db.push(path, { id: userId, secret: user.temp_secret });
      res.sendFile('textos.html', {root: __dirname});
    } else {
      res.json({ verified: false})
    }
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving user'})
  };
});

app.post('/hacerfirma', (req, res)=>{
  const data = fs.readFileSync('./subidos/secretioso.txt');
  signature = crypto.sign("sha256", Buffer.from(data), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  })
    fs.writeFile('./firmados/secreto.txt', signature, 'ascii', function(err) { 
      if (err) {
        console.log(err);
      } else {
        alert('firmado');
        res.send();
      }
    });
});

app.post('/verificarfirma', (req, res)=>{
  const verifiableData = fs.readFileSync('./subidos/secretioso.txt');
const signature = crypto.sign("sha256", Buffer.from(verifiableData), {
	key: privateKey,
	padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
})
const isVerified = crypto.verify(
	"sha256",
	Buffer.from(verifiableData),
	{
		key: publicKey,
		padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
	},
	signature
)
fs.writeFile('./desfirmados/desfirmado.txt', signature, 'ascii', function(err) { 
  if (err) {
    console.log(err);
  } else {
    alert('verificado');
    res.send();
  }
});
});

app.post('/cifrar', (req, res)=>{
  const cryptr = new Cryptr('eljeviestkubwe');
  const encryptedString = cryptr.encrypt('./subidos/secretioso.txt');
  const decryptedString = cryptr.decrypt(encryptedString);
  fs.writeFile('./cifrados/protegido.txt', encryptedString, 'ascii', function(err) { 
    if (err) {
      console.log(err);
    } else {
      alert('encriptado');
      res.send();
    }
  });
  
});

app.post('/decifrar', (req,res)=>{
  const cryptr = new Cryptr('eljeviestkubwe');
  const encryptedString = cryptr.encrypt('./subidos/secretioso.txt'); 
  const decryptedString = cryptr.decrypt(encryptedString); 
  fs.writeFile('./decifrados/decifrado.txt', decryptedString, 'ascii', function(err) { 
    if (err) {
      console.log(err);
    } else {
      alert('decifrado');
      res.send();
    }
  });


  });

app.post('/mostrarfirmas', (root,res)=>{
  fs.readdir('firmados', (err, files) => {
  res.send(files);
});
});

app.post('/mostrardesfirmados', (root,res)=>{
  fs.readdir('desfirmados', (err, files) => {
  res.send(files);
});
});

app.post('/vercifrados', (root,res)=>{
  fs.readdir('cifrados', (err, files) => {
  res.send(files);
});
});

app.post('/verdecifrados', (root,res)=>{
  fs.readdir('decifrados', (err, files) => {
  res.send(files);
});
});

const port = 3000;
app.listen(port, () => {
  console.log(`App is running on PORT: ${port}.`);
});