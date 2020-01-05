const tmi = require("tmi.js");
var bettingStarted = "False";
var bettingEnded = "False";

var totalBlueShrooms = 0;
var totalRedShrooms = 0;
var totalBlueBets = 0;
var totalRedBets = 0;

var betTime = 0;
var betStartDate = 0;
var betStartTime = 0;

var didBet = "False";

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
  // // Ignore messages from the bot
  // if (self) {
  //   return;
  // }

  // Remove whitespace from chat message
  const messageContent = message.trim();

  if (messageContent.includes("@" + opts.identity.username + " - You have ")) {
    balanceSplit = messageContent.split(" ");
    currentBalance = parseInt(balanceSplit[4]);
    console.log("Current Balance: " + currentBalance);
  }

  /*
  #######################################################
  ###### Handling messages from user "xxsaltbotxx" ######
  #######################################################
  */

  if (context.username.trim() === "xxsaltbotxx") {
    // read balance from chat if toggled
    if (
      messageContent.includes("@" + opts.identity.username + " - You have ")
    ) {
      balanceSplit = messageContent.split(" ");
      currentBalance = parseInt(balanceSplit[4]);
      console.log("Current Balance: " + currentBalance);
    }

    // Handling bet messages from users
    if (messageContent.includes("Bet complete")) {
      // check if it is the first bet this round
      if (!bettingStarted.includes("True")) {
        console.log("Betting Has Started");
        client.say(target, "!balance");
        betStartDate = new Date();
        betStartTime = betStartDate.getTime();
      }
      // Mark current betting round as started
      bettingStarted = "True";
      bettingEnded = "False";

      // Parses user messages to extract bet details
      splits = messageContent.split(" ");
      team = splits[5].substring(0, splits[5].length - 1);
      amount = parseInt(splits[6].substring(0, splits[6].length - 1));
      if (team.includes("BLUE")) {
        totalBlueShrooms += amount;
        totalBlueBets += 1;
      } else {
        totalRedShrooms += amount;
        totalRedBets += 1;
      }

      // Prints total bets and amounts for each team after each bet
      console.log(
        "Blue: " + totalBlueShrooms + " Shrooms | " + totalBlueBets + " Bets"
      );
      console.log(
        "Red:  " + totalRedShrooms + " Shrooms | " + totalRedBets + " Bets\n"
      );

      // Calculate duration of current bet cycle
      currentDate = new Date();
      currentTime = currentDate.getTime();
      betTime = currentTime - betStartTime;

      console.log("Bet Timer: " + Math.floor(betTime / 1000));

      // Bet if current bet cycle reached 160 seconds
      if (betTime >= 160000 && didBet.includes("False")) {
        underdog = "blue";
        if (totalBlueShrooms > totalRedShrooms) {
          underdog = "red";
        }
        betAmount = Math.floor(currentBalance / 10);
        client.say(target, `!${underdog} ${betAmount}`);
        console.log(`Bot bet ${betAmount} on ${underdog}`);
        didBet = "True";
      }
    }
  }

  // Detect End of Betting Phase
  if (
    (context.username.trim() === "xxsaltbotxx" &&
      messageContent.includes("Betting has ended")) ||
    betTime > 220000
  ) {
    if (!bettingEnded.includes("True")) {
      console.log("Betting Has Ended!");
    }
    // Mark current betting round as ended and reset bet cycle variables
    bettingEnded = "True";
    bettingStarted = "False";
    betTime = 0;
    totalRedShrooms = 0;
    totalBlueShrooms = 0;
    totalBlueBets = 0;
    totalRedBets = 0;
    didBet = "False";
  }
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
