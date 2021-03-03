const router = require("express").Router();
const Discord = require("discord.js");
const client = new Discord.Client();
const firebase = require("firebase")
const FormData = require("form-data");
const session = require("express-session");
const fetch = require("node-fetch");
const config = require("../config.json")
const Bots = require("../Clusters/Models/Bots.js");
const Users = require("../Clusters/Models/Users.js")
const Analises = require("../Clusters/Models/Analises.js")

var firebaseConfig = {
    apiKey: "AIzaSyDkEkWuQnJMsOogUrIbXrQPe6XVT62eMoM",
    authDomain: "rocketlist-ace21.firebaseapp.com",
    databaseURL: "https://rocketlist-ace21.firebaseio.com",
    projectId: "rocketlist-ace21",
    storageBucket: "rocketlist-ace21.appspot.com",
    messagingSenderId: "641564054297",
    appId: "1:641564054297:web:cf6cd74153d1f493ea2b88",
    measurementId: "G-22CCXKE0JH"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

client.login(config.token);
client.on("ready", async () => {

  console.log("APLICAÇÃO INICIADA!");

  setInterval(async () => {

  let filter = {};
  let allBots = await Bots.find(filter)

  allBots.forEach(async function(bot) {

    client.users.fetch(bot._id).then(async member => {

      await Bots.findByIdAndUpdate(bot._id , { $set: { avatar: member.avatarURL({ dynamic: true, size: 4096 }) } })

    })
   })
 }, 120000)

});
                            

router.get("/", async(req, res) => {

  let filter  = {};
  let user    = req.session.user || null
  let allBots = await Bots.find(filter)

  if(user) {
   
      new Users({
          _id: user.id
      }).save()

  Users.findOne({ _id: user.id }, async(err, dados) => {

    if(dados) {
    
    } else {
    
      new Users({
          _id: user.id
      }).save()

           let embed = new Discord.MessageEmbed()

.setDescription(`Usuário ${user.username} registrado na database com sucesso !`)
       
       client.channels.cache.get('803007700375306300').send(embed)
    }
  })
  
  res.render("index.ejs", { Bots: allBots, client, user,  })
    
  } else {
    
      res.render("index.ejs", { Bots: allBots, client, user, })
    
  }


});


router.post("/addbot/enviar", async(req, res) => {

      let dados = req.body
      let user = req.session.user
      
client.users.fetch(dados.id).then(member => {
      
      new Analises({
          _id: dados.id,
          name: dados.nome,
          prefix: dados.prefixo,
          invite: dados.botinvite,
          suporte: dados.botsuporte,
          owner: user.id,
          shortdescription: dados.descp,
          description: dados.descg,
          livraria: dados.livraria,
          avatar: member.avatarURL({ dynamic: true, size: 4096 }),
      }).save()
  
  
client.channels.cache.get("803007659691081747").send(`<@!${user.id}> adicionou ${member.tag} para verificação! \n\ https://botsdediscord.ml/bots/${dados.id}`)

  })
  res.render("addbot_enviar.ejs", { user, client })

})

router.get("/confirm/:botID", async (req, res) => {

  let filter  = {};
  let botID = req.params.botID
  let user    = req.session.user
  let allBots = await Bots.find(filter)

  await Bots.findOne({ _id: botID }, async (err, dados) => {

    if(dados) {

      res.render("anunciar.ejs", { user, client, dados })

      }

  })

    

});



router.get('/perfil', async (req, res) => {
    
  let user = req.session.user
   client.users.fetch(user.id).then(usuario => { 

res.render('perfil.ejs', { userinfo: usuario, client, user: req.session.user || null }); });
  
})

router.get("/vote", async(req, res) => {

  let user    = req.session.user
  
  res.render("vote.ejs", { client, user })

})

router.get("/addbot", async(req, res) => {

  let user    = req.session.user
  
  res.render("addbot.ejs", { client, user })

})

router.get("/delete/:botID", async(req, res) => {

  let botID = req.params.botID
  let user  = req.session.user

  await Bots.findOne({ _id: botID }, async (err, dados) => {

        new Bots({
             _id: botID,
             name: dados.name,
             prefix: dados.prefix,
             invite: dados.invite,
             suporte: dados.suporte,
             owner: dados.owner,
             shortdescription: dados.shortdescription,
             description: dados.description,
             avatar: dados.avatar,
             livraria: dados.livraria
         }).delete()

client.channels.cache.get("803007659691081747").send(`<@!${botID}> de <@!${dados.owner}> foi deletado por <@!${user.id}> !`)

    let embed2 = new Discord.MessageEmbed()
.setDescription(`<@!${dados.owner} Seu bot <@!${botID}> foi deletado por <@!${user.id}>!`)

    res.redirect("/analises")

    client.users.cache.get(dados.owner).send(embed2).catch(err => {

      let embed = new Discord.MessageEmbed().setDescription(`**|** Erro ao enviar mensagem para <@!${dados.owner}>\n\n\`\`\`js\n${err}\`\`\``)

      client.channels.cache.get('803007659691081747').send(embed)

    })

    client.guilds.cache.get('800505498926579772').members.cache.get(botID).kick({ reason: 'Bot deletado !' })

  })

})

router.get("/painel", async (req, res) => {

  let filter  = {};
  let user    = req.session.user
  let allBots = await Bots.find(filter)

  if(!client.guilds.cache.get('800505498926579772').members.cache.get(user.id)) return res.send('Você precisa ser um adminstrador para acessar essa pagina.')
  if(!client.guilds.cache.get('800505498926579772').members.cache.get(user.id).roles.cache.has(('803007230001676308'))) return res.send('Access denied !')

    setTimeout(() => {

     res.render("painel.ejs", { Bots: allBots, client, user })

    }, 2000)

});


router.get("/bots/:botID", async(req, res) => {

  let botID = req.params.botID
  let stringID = req.params.botID.toString();
  let user = req.session.user
  let ms = require('parse-ms')
  let daily = await db.ref(`Cowndown/Votes/${user.id}/${stringID}/Timer`).once('value')
      daily = daily.val()
  let timeout = 43200000
  let time = ms(timeout - (Date.now() - daily));


  await Bots.findOne({ _id: botID }, async (err, dados) => {

    if (dados) {

      if (daily !== null && timeout - (Date.now() - daily) > 0) {

          if(time) time = `Vote again on ${time.hours}h ${time.minutes}m ${time.seconds}s`
          
          let dono;
              dono = client.users.cache.get(dados.owner).tag

          let avatardono;
              avatardono = client.users.cache.get(dados.owner).avatar

          res.render("info_bots.ejs", { dados, client, db, stringID, time, user, dono, avatardono })

      } else {

          if(time) time = `Vote`
          
          let dono;
              dono = client.users.cache.get(dados.owner).tag

          let avatardono;
              avatardono = client.users.cache.get(dados.owner).avatar

          res.render("info_bots.ejs", { dados, client, db, stringID, time, user, dono, avatardono })
      }

    } else {

          res.render("error_bot.ejs", { dados, client, db, stringID, time, user,  })

    }

  })

})

router.get("/analisar/:botID", async(req, res) => {

  let botID = req.params.botID
  let user  = req.session.user
  let dono  = req.session.dono

  await Analises.findOne({ _id: botID }, async(err, dados) => {

    if(dados) {

      res.render("info_analise.ejs", { user, client, dados, dono })

      }

  })

})

router.get('/bots/:botID/votar', async (req, res) => {

    let user = req.session.user;
    let botID = req.params.botID;
    let stringID = req.params.botID.toString();
    let botdb = await Bots.findById(stringID);
    let ms = require('parse-ms')

 let daily = await db.ref(`Cowndown/Votes/${user.id}/${stringID}/Timer`).once('value')
     daily = daily.val()

 let timeout = 43200000

 if (daily !== null && timeout - (Date.now() - daily) > 0) {

            let time = ms(timeout - (Date.now() - daily)); 

            let err = ` ${user.username}#${user.discriminator}, você ja votou aguarde: ${time.hours}horas ${time.minutes}minutos ${time.seconds}segundos para votar novamente.`

            return res.redirect(`/bots/${botID}`)

 } else {

    botdb.votes += 1;
    botdb.save()
    db.ref(`Cowndown/Votes/${user.id}/${stringID}/Timer`).set(Date.now());

    await Bots.findOne({ _id: stringID }, async (err, dados) => {

      if(dados) {

client.channels.cache.get("803007727919431760").send(`<@!${user.id}> Votou no bot ${dados.name} com sucesso ! !`)
        
        res.redirect("/vote")
      }

    })

  }
})

router.get("/analises", async (req, res) => {

  let user = req.session.user;

  if(!client.guilds.cache.get('800505498926579772').members.cache.get(user.id)) return res.send('You must be a Moderator to access.')
  if(!client.guilds.cache.get('800505498926579772').members.cache.get(user.id).roles.cache.has(('803008752286564362'))) return res.send('Access denied !')

  let filter = {};
  let analise = await Analises.find(filter);

    setTimeout(() => {

          res.render("analises.ejs", { user, Bots: analise, client });

    }, 2000)

});

router.get("/aprovar/:botID", async(req, res) => {

  let botID = req.params.botID;
  let user  = req.session.user;

      await Analises.findOne({ _id: botID }, async (err, dados) => {

      new Bots({
          _id: botID,
          name: dados.name,
          prefix: dados.prefix,
          invite: dados.invite,
          suporte: dados.suporte,
          owner: dados.owner,
          dono: dados.dono,
          shortdescription: dados.shortdescription,
          avatar: dados.avatar,
          livraria: dados.livraria
      }).save()

      new Analises({
          _id: botID,
          name: dados.name,
          prefix: dados.prefix,
          invite: dados.invite,
          suporte: dados.suporte,
          owner: dados.owner,
          dono: dados.dono,
          shortdescription: dados.shortdescription,
          avatar: dados.avatar,
         livraria: dados.livraria
      }).delete()

          await Users.findByIdAndUpdate(dados.owner, { $push: { bots: botID } })


client.channels.cache.get("803007659691081747").send(`<@!${botID}> de <@!${dados.owner}> foi aprovado por <@!${user.id}> \n\ https://botsdediscord.ml/bots/${dados.id}`)

          let embed2 = new Discord.MessageEmbed()
.setDescription(`Seu bot <@!${botID}> foi aprovado na Bots de Discord por <@!${user.id}>!`)

          res.redirect("/analises")

          client.users.cache.get(dados.owner).send(embed2).catch(err => {

            let error = new Discord.MessageEmbed().setDescription(`**|** Erro ao enviar mensagem para <@!${dados.owner}>\n\n\`\`\`js\n${err}\`\`\``)

            client.guilds.cache.get('800505498926579772').members.cache.get(botID).roles.add('803331699659636806')
            client.guilds.cache.get('800505498926579772').members.cache.get(botID).roles.remove('803332122609844344')
            client.channels.cache.get('803007659691081747').send(error)

          })
      })

})

router.get("/reprovar/:botID", async(req, res) => {

  let botID = req.params.botID
  let user  = req.session.user

  await Analises.findOne({ _id: botID }, async (err, dados) => {

        new Analises({
             _id: botID,
             name: dados.name,
             prefix: dados.prefix,
             invite: dados.invite,
             suporte: dados.suporte,
             owner: dados.owner,
             shortdescription: dados.shortdescription,
             description: dados.description,
             avatar: dados.avatar,
             livraria: dados.livraria,
         }).delete()

client.channels.cache.get("803007659691081747").send(`<@!${botID}> de <@!${dados.owner}> foi reprovado por <@!${user.id}> !`)

    let embed2 = new Discord.MessageEmbed()
.setDescription(`Seu bot <@!${botID}> foi reprovado na Bots de Discord por <@!${user.id}>!`)

    res.redirect("/analises")

    client.users.cache.get(dados.owner).send(embed2).catch(err => {

      let embed = new Discord.MessageEmbed().setDescription(`**|** Erro ao enviar mensagem para <@!${dados.owner}>\n\n\`\`\`js\n${err}\`\`\``)

      client.channels.cache.get('803007659691081747').send(embed)

    })
    client.guilds.cache.get('800505498926579772').members.cache.get(botID).kick({ reason: 'Bot reprovado !' })

  })

})

router.get("/logar", (req, res) => {
  res.redirect(`https://discordapp.com/api/oauth2/authorize?client_id=${config.clientID}&scope=${config.scopes.join("%20")}&response_type=code&redirect_uri=${config.redirectURL}`)
});

router.get("/callback", (req, res) => {
if(!req.query.code) return res.redirect("/");
if(req.query.code.length != 30) return res.redirect("/");

const data = new FormData();
data.append("client_id", config.clientID);
data.append("client_secret", config.clientSecret);
data.append("grant_type", "authorization_code");
data.append("redirect_uri", config.redirectURL);
data.append("scope", config.scopes.join(" "));
data.append("code", req.query.code);

fetch("https://discordapp.com/api/oauth2/token", {method: "POST", body: data}).then(res => res.json()).then(response => {
if(response.scope != config.scopes.join(" ")) return res.redirect("/logar");

fetch("https://discordapp.com/api/users/@me", {method: "GET", headers: {authorization: `Bearer ${response.access_token}`}})
.then(res2 => res2.json())
.then(userResponse => {
if(userResponse.code === 0) userResponse.code = 0
else userResponse.code = 200;
if(userResponse.code == 0) return res.redirect("/logar");

userResponse.username = userResponse.username;
userResponse.discriminator = userResponse.discriminator;
userResponse.tag = userResponse.username+"#"+userResponse.discriminator;
userResponse.avatarURL = "https://cdn.discordapp.com/avatars/"+userResponse.id+"/"+userResponse.avatar+".png?size=1024";
userResponse.access_token = response.access_token;
userResponse.refresh_token = response.refresh_token;
userResponse.expira = Date.now() + response.expires_in;
userResponse.logou = Date.now();

req.session.user = userResponse;

let headers = {
"Content-Type": "application/json",
"Authorization": "Bearer "+response.access_token
}

fetch("https://discordapp.com/api/users/@me/guilds", {
  method: "GET", headers: headers
}).then(res => res.json()).then(servidores => {
  req.session.servidores = servidores
});

if(req.session.redir){
res.redirect(req.session.redir);
return;
};
res.redirect("/");
})})});

function checkAuth(req, res, next) {

  if (req.session.login) return next();

  req.session.login = false;
  req.session.page = 1;
  res.redirect("/oauth2");

}

module.exports = router;