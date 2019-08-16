const request = require('request'),
  fs = require('fs'),
  Discord = require('discord.js');
const formatNumber = new Intl.NumberFormat('en').format;


let data = getData();
const botToken = data['BotToken'];

let failuresWSB = 0, failuresSkinDB = 0;

// updateWSB();
updateSkinDB();

// setInterval(updateWSB, 1000 * 60 * 15);
setInterval(updateSkinDB, 1000 * 60 * 15);

const client = new Discord.Client();
client.on('error', (err) => {
  console.error(new Date() + ": Discord client encountered an error");
  console.error(err);
});

client.login(botToken);

function updateWSB() {
  request('https://workshopbrowser.com/stats', {
    headers: {
      Accept: 'application/json'
    }
  }, (err, res, body) => {
    if (err) return console.error(err);
    if (res.statusCode !== 200) return console.error('API-Request failed: ', body)

    body = JSON.parse(body);

    for (const channelID in data['Stats']['WSB']) {
      if (data['Stats']['WSB'].hasOwnProperty(channelID)) {
        const lastMsgID = data['Stats']['WSB'][channelID];

        let reqBody = JSON.stringify({
          embed: {
            title: '**Statistics | Workshop Browser**',
            url: 'https://workshopbrowser.com/stats',
            color: 16738378,
            timestamp: new Date().toISOString(),
            thumbnail: {
              url: 'https://workshopbrowser.com/img/favicons/android-chrome-256x256.png'
            },
            author: {
              name: 'Workshop Browser',
              url: 'https://workshopbrowser.com/',
              icon_url: 'https://workshopbrowser.com/img/favicons/android-chrome-256x256.png'
            },
            fields: [
              {
                name: 'Games',
                value: formatNumber(body['estGameCount'])
              },
              {
                name: 'User',
                value: formatNumber(body['estUserCount']),
                inline: true
              },
              {
                name: 'User with Uploads',
                value: formatNumber(body['userCountWithUploads']),
                inline: true
              },
              {
                name: 'Files uploaded',
                value: formatNumber(body['estFileUploads'])
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
            failuresWSB++;

            if (!lastMsgID || failuresWSB >= 2) {
              request('https://discordapp.com/api/channels/582799725435158528/messages', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bot ${botToken}`
                },
                body: reqBody
              }, (err, res, body) => {
                if (err) return console.error(err);
                if (res.statusCode !== 200) return console.error('API-Request failed: ', body);

                failuresWSB = 0;

                data['Stats']['WSB'][channelID] = JSON.parse(body).id;
                setData();
              });
            }
          } else {
            failuresWSB = 0;
          }
        });
      }
    }
  });
}

function updateSkinDB() {
  request('https://api.skindb.net/stats', (err, res, body) => {
    if (err) return console.error(err);
    if (res.statusCode !== 200) return console.error(`API-Request failed (Status ${res.statusCode}):`, body);

    body = JSON.parse(body);

    for (const channelID in data['Stats']['SkinDB']) {
      if (data['Stats']['SkinDB'].hasOwnProperty(channelID)) {
        const lastMsgID = data['Stats']['SkinDB'][channelID];

        let reqBody = JSON.stringify({
          embed: {
            title: '**Statistics | SkinDB**',
            url: 'https://SkinDB.net/',
            color: 16738378,
            timestamp: new Date().toISOString(),
            thumbnail: {
              url: 'https://skindb.net/img/Logo.png'
            },
            author: {
              name: 'SkinDB',
              url: 'https://SkinDB.net/',
              icon_url: 'https://skindb.net/img/Logo.png'
            },
            fields: [
              {
                name: 'Skins',
                value: formatNumber(body['estSkinCount']),
                inline: true
              },
              {
                name: 'Duplicates',
                value: formatNumber(body['duplicateSkinCount']),
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

    Stats: {
      WSB: {

      }
    }
  }));
  setData();
  return getData();
}

function setData() {
  fs.writeFileSync('./storage/data.json', JSON.stringify(data));
}