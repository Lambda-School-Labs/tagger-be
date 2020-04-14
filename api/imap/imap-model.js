const imapSimple = require("imap-simple");
const simpleParser = require("mailparser").simpleParser;
const messagesModel = require("../messages/message-model");

// TODO:  userId and lastUid (userId from DB and id of last message retrieved)

async function getMail({ imapUser, imapPassword, imapServer }) {
  const imapConnection = await imapSimple.connect({
    imap: {
      user: imapUser,
      password: imapPassword,
      host: imapServer,
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      debug: console.log
    }
  });

  await imapConnection.openBox("INBOX");

  //const lastUid = 180; // TODO: Get value from DB: Messages.getLastEmailFromUser
  //const searchCriteria = ["ALL", ["UID", lastUid + ":*"]];
  //const searchCriteria = ["ALL", ["UID", "186:*"]];
  const searchCriteria = ["ALL"];
  const fetchOptions = { bodies: "", attributes: "" };

  const searchResults = await imapConnection.search(
    searchCriteria,
    fetchOptions
  );

  imapConnection.end();

  const parsedMessages = await parseImapSearchResults(searchResults);
  const dboMessages = parsedMessagesToDBO(parsedMessages);

  addMessagesToDb(dboMessages);

  return dboMessages;
}

async function parseImapSearchResults(searchResults) {
  const imapMessages = Promise.all(
    searchResults.map(async imapMessage => {
      const firstPart = imapMessage.parts[0];
      const parsedMessage = await simpleParser(firstPart.body);

      return { ...parsedMessage, attributes: imapMessage.attributes };
    })
  );

  return imapMessages;
}

function parsedMessagesToDBO(parsedMessages) {
  const dboMessages = parsedMessages.map(msg => {
    return {
      uid: msg.attributes.uid,
      from: msg.from.value.map(f => f.address).join(","),
      name: msg.from.value.map(f => f.name).join(","),
      to: msg.to.value.map(t => t.address).join(","),
      subject: msg.subject,
      email_body: msg.html,
      email_body_text: msg.text,
      message_id: msg.messageId,
      date: msg.date,
      labels: msg.attributes["x-gm-labels"].toString(),
      gMsgId: msg.attributes["x-gm-msgid"],
      gmThreadID: msg.attributes["x-gm-thrid"],
      user_id: 1 // TODO
    };
  });

  return dboMessages;
}

function addMessagesToDb(dboMessages) {
  dboMessages.forEach(dboMessage => {
    messagesModel.addEmail(dboMessage)
      .then(res => {
        console.log(`${dboMessage.uid} was added`)
      })
      .catch(err => {
        console.log(`${dboMessage.uid} was NOT added: ${err.code}`)
      });
  });
}

module.exports = {
  getMail
};
