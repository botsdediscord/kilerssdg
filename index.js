const http = require("http"); 
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const app = express();
const cookieParser = require("cookie-parser");
const moment = require("moment");
moment.locale("pt-br");
const session = require('express-session');
const Discord = require("discord.js");
const port = process.env.PORT || 3000;
const client = new Discord.Client();
const flash = require('connect-flash');


require('./Bot/index.js')

client.login('Nzk4MzIyMDA2ODQzMTk1NDQy.X_zVTg.FXSk0PiYIQUfylfHGQU8j8IQu64')

client.on('ready', async () => {

  console.log('Loguei com sucesso na API Discord.JS !')
  
})

require("./Clusters/Cluster-01.js");

app.use(session({ secret: 'keyboard cat', cookie: { }, resave: true,saveUninitialized: true,}))

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use("/", require("./routes/router"));
app.listen(process.env.PORT, () =>
  console.log("Rodando com sucesso na porta " + process.env.PORT)
);


app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());