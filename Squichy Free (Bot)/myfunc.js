const { jidNormalizedUser, proto, getContentType, areJidsSameUser } = require("@whiskeysockets/baileys")
const chalk = require('chalk')
const fs = require('fs')

exports.runtime = function(seconds) {
  seconds = Number(seconds);
  var d = Math.floor(seconds / (3600 * 24));
  var h = Math.floor(seconds % (3600 * 24) / 3600);
  var m = Math.floor(seconds % 3600 / 60);
  var s = Math.floor(seconds % 60);
  var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
  var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
  var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
  var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
  return dDisplay + hDisplay + mDisplay + sDisplay;
}

exports.sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.smsg = (Primis, m, store) => {
    if (!m) return m
    let M = proto.WebMessageInfo
    if (m.key) {
        m.id = m.key.id
        m.from = m.key.remoteJid.startsWith('status') ? jidNormalizedUser(m.key?.participant || m.participant) : jidNormalizedUser(m.key.remoteJid);
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = Primis.decodeJid(m.fromMe && Primis.user.id || m.participant || m.key.participant || m.chat || '')
        if (m.isGroup) m.participant = Primis.decodeJid(m.key.participant) || ''
    }
    if (m.message) {
        m.mtype = getContentType(m.message)
        m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype])
        m.body = m.message?.conversation || m.msg?.caption || m.msg?.text || (m.mtype == 'listResponseMessage') && m.msg?.singleSelectReply?.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.msg?.selectedButtonId || (m.mtype == 'viewOnceMessage') && m.msg?.caption || m.text
        let quoted = m.quoted = m.msg?.contextInfo ? m.msg?.contextInfo?.quotedMessage : null
        m.mentionedJid = m.msg?.contextInfo ? m.msg?.contextInfo?.mentionedJid : []
        if (m.quoted) {
            let type = getContentType(quoted)
			m.quoted = m.quoted[type]
            if (['productMessage'].includes(type)) {
				type = getContentType(m.quoted)
				m.quoted = m.quoted[type]
			}
            if (typeof m.quoted === 'string') m.quoted = {
				text: m.quoted
			}
 
				m.quoted.key = {
					remoteJid: m.msg?.contextInfo?.remoteJid || m.from,
					participant: jidNormalizedUser(m.msg?.contextInfo?.participant),
					fromMe: areJidsSameUser(jidNormalizedUser(m.msg?.contextInfo?.participant), jidNormalizedUser(Primis?.user?.id)),
					id: m.msg?.contextInfo?.stanzaId,
				};
            
            m.quoted.mtype = type
            m.quoted.from = /g\.us|status/.test(m.msg?.contextInfo?.remoteJid) ? m.quoted.key.participant : m.quoted.key.remoteJid;
            m.quoted.id = m.msg.contextInfo.stanzaId
			m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false
			m.quoted.sender = Primis.decodeJid(m.msg.contextInfo.participant)
			m.quoted.fromMe = m.quoted.sender === (Primis.user && Primis.user.id)
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || ''
			m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
            m.getQuotedObj = m.getQuotedMessage = async () => {
			if (!m.quoted.id) return false
			let q = await store.loadMessage(m.chat, m.quoted.id, Primis)
 			return exports.smsg(Primis, q, store)
            }
            let vM = m.quoted.fakeObj = M.fromObject({
                key: {
                    remoteJid: m.quoted.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id
                },
                message: quoted,
                ...(m.isGroup ? { participant: m.quoted.sender } : {})
            })

            m.quoted.delete = () => Primis.sendMessage(m.quoted.chat, { delete: vM.key })

            m.quoted.copyNForward = (jid, forceForward = false, options = {}) => Primis.copyNForward(jid, vM, forceForward, options)

            m.quoted.download = () => Primis.downloadMediaMessage(m.quoted)
        }
    }
    if (m.msg?.url) m.download = () => Primis.downloadMediaMessage(m.msg)
    m.text = m.msg?.text || m.msg?.caption || m.message?.conversation || m.msg?.contentText || m.msg?.selectedDisplayText || m.msg?.title || ''

    m.reply = (text, quoted = m, chatId = m.chat, options = {}) => Buffer.isBuffer(text) ? Primis.sendMedia(chatId, text, 'file', '', quoted, { ...options }) : Primis.sendText(chatId, text, quoted, { ...options })
 
	m.copy = () => exports.smsg(Primis, M.fromObject(M.toObject(m)))

	m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => Primis.copyNForward(jid, m, forceForward, options)
    
    return m
};
let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright(`Update ${__filename}`))
  delete require.cache[file]
  require(file)
})
