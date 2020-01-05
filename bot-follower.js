const tmi = require("tmi.js");
const fs = require("fs");

// Define configuration options
const opts = {
  identity: {
    username: "username",
    password: "oauth:token"
  },
  connection: {
    secure: true,
    reconnect: true
  },
  channels: ["saltyteemo"]
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on("message", onMessageHandler);
client.on("connected", onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler(target, context, message, self) {
  // Remove whitespace from chat message
  const messageContent = message.trim();

  /*
  #######################################################
  ###### Handling messages from user "xxsaltbotxx" ######
  #######################################################
  */

  // console.log(context.username + ": " + messageContent);

  // @majorlagg - Bet complete for RED, 30000. Your new balance is 1130204.
  if (context.username.trim() === "xxsaltbotxx") {
    if (messageContent.includes("@majorlagg - Bet complete")) {
      let splits = messageContent.split(" ");
      let team = splits[5].substring(0, splits[5].length - 1);
      team = team.toLowerCase();
      let amount = parseInt(splits[6].substring(0, splits[6].length - 1));

      // client.say(target, `!${team} ${amount}`);
      client.say(target, `!${team} 4000`);
      console.log(`!${team} 4000 | @majorlagg bet ${amount}`);
    }
  }
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
