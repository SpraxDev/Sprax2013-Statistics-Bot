const request = require('request'),
  fs = require('fs'),
  Discord = require('discord.js');
const formatNumber = new Intl.NumberFormat('en').format;


let data = getData();
const botToken = data['BotToken'];

let failuresSkinDB = 0;

updateSkinDB();

setInterval(updateSkinDB, 1000 * 60 * 15);

const client = new Discord.Client();
client.on('error', (err) => {
  console.error(new Date() + ": Discord client encountered an error");
  console.error(err);
});

client.on('guildMemberAdd', async (member) => {
  const channel = client.channels.get(data['JoinLeaveChannelID']);
  if (!channel) return;

  channel.send(new Discord.RichEmbed()
    .setTitle('Admin-Info')
    .setColor('#00ff48')
    .setDescription(`${member.user.username} joined the server`)
    .setImage(member.user.displayAvatarURL)
    .addField('User Tag', member.user.tag, true)
    .addField('ID', member.user.id, true)
    .setTimestamp()
  );

  if (!member.user.bot) {
    member.addRole('636554066910117918');
  }
});

client.on('guildMemberRemove', async (member) => {
  const channel = client.channels.get(data['JoinLeaveChannelID']);
  if (!channel) return;

  channel.send(new Discord.RichEmbed()
    .setTitle('Admin-Info')
    .setColor('#ff0000')
    .setDescription(`${member.user.username} left the server`)
    .setImage(member.user.displayAvatarURL)
    .addField('User Tag', member.user.tag, true)
    .addField('ID', member.user.id, true)
    .setTimestamp()
  );
});

client.login(botToken);

function updateSkinDB() {
  request('https://api.skindb.net/stats', {
    auth: {
      bearer: data['SpraxAPI_Token']
    }
  }, (err, res, body) => {
    if (err) return console.error(err);
    if (res.statusCode !== 200) return console.error(`API-Request failed (Status ${res.statusCode}):`, body);

    body = JSON.parse(body);

    for (const channelID in data['Stats']['SkinDB']) {
      if (data['Stats']['SkinDB'].hasOwnProperty(channelID)) {
        const lastMsgID = data['Stats']['SkinDB'][channelID];

        let reqBody = JSON.stringify({
          embed: {
            title: '**Statistics | SkinDB**',
            url: 'https://skindb.net/',
            color: 16738378,
            timestamp: new Date().toISOString(),
            thumbnail: {
              url: 'https://skindb.net/img/Logo.png'
            },
            author: {
              name: 'SkinDB',
              url: 'https://skindb.net/stats',
              icon_url: 'https://skindb.net/img/Logo.png'
            },
            fields: [
              /* Line 1 */
              {
                name: 'Skins',
                value: formatNumber(body['estSkinCount']),
                inline: true
              },
              {
                name: 'Duplicates',
                value: formatNumber(body['duplicateSkinCount']),
                inline: true
              },

              /* Line 2 */
              {
                name: 'Generated Today',
                value: formatNumber(body['advanced']['last24h']),
                inline: true
              }
            ]
          }
        });

        request(`https://discordapp.com/api/channels/${channelID}/messages/${lastMsgID || -1}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bot ${botToken}`
          },
          body: reqBody
        }, (err, res, _body) => {
          if (err) return console.error(err);

          if (res.statusCode !== 200) {
            failuresSkinDB++;

            if (!lastMsgID || failuresSkinDB >= 2) {
              request(`https://discordapp.com/api/channels/${channelID}/messages`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bot ${botToken}`
                },
                body: reqBody
              }, (err, res, body) => {
                if (err) return console.error(err);
                if (res.statusCode !== 200) return console.error('API-Request failed: ', body);

                failuresSkinDB = 0;

                data['Stats']['SkinDB'][channelID] = JSON.parse(body).id;
                setData();
              });
            }
          } else {
            failuresSkinDB = 0;
          }
        });
      }
    }
  });
}

function getData() {
  if (fs.existsSync('./storage/data.json')) {
    return JSON.parse(fs.readFileSync('./storage/data.json', { encoding: 'UTF-8' }));
  }

  fs.writeFileSync('./storage/data.json', JSON.stringify({
    BotToken: "BOT_TOKEN_HERE",
    SpraxAPI_Token: "SPRAXAPI_TOKEN_HERE",

    JoinLeaveChannelID: "DISCORD_CHANNEL_ID",

    Stats: {
      SkinDB: {}
    }
  }, null, 4));
  setData();
  return getData();
}

function setData() {
  fs.writeFileSync('./storage/data.json', JSON.stringify(data));
}