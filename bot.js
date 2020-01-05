const tmi = require("tmi.js");
const fs = require("fs");

let bettingStarted = "False";
let bettingEnded = "False";

let totalBlueShrooms = 0;
let totalRedShrooms = 0;
let totalBlueBets = 0;
let totalRedBets = 0;

let betTime = 0;
let betStartDate = 0;
let betStartTime = 0;

let didBet = "False";
let betAmount = 0;
let underdog = "none";
let currentBalance = 0;
let oldBalance = 0;
let payOutRatio = 0;

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

  if (context.username.trim() === "sangokaku") {
    console.log(
      "\u001b[" + 91 + "m" + "sangokaku: " + messageContent + "\u001b[0m"
    );
  }

  if (context.username.trim() === "Majorlagg") {
    console.log(
      "\u001b[" + 91 + "m" + "Majorlagg: " + messageContent + "\u001b[0m"
    );
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
        underdog = totalBlueShrooms > totalRedShrooms ? "red" : "blue";
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
      // calculate pay out ratio if successful
      payOutRatio = underdog.includes("blue")
        ? totalRedShrooms / totalBlueShrooms
        : totalBlueShrooms / totalRedShrooms;
      // read match-history.json and parse it as JSON
      let rawdata = fs.readFileSync("match-history.json");
      let matchHistoryJSON = JSON.parse(rawdata);

      // Determine winner of previous match by comparing current balance with balance before last bet
      previousMatch = matchHistoryJSON.games[matchHistoryJSON.games.length - 1];
      previousMatch.winner =
        previousMatch.balance < currentBalance
          ? previousMatch.betOn
          : previousMatch.betOn.includes("red")
          ? "blue"
          : "red";

      // populate match data to be stored in JSON
      jsonString = {
        balance: currentBalance,
        betTime: betTime,
        blueShrooms: totalBlueShrooms,
        redShrooms: totalRedShrooms,
        blueBets: totalBlueBets,
        redBets: totalRedBets,
        payOutRatio: payOutRatio,
        betOn: underdog,
        amountBet: betAmount,
        winner: "na"
      };
      // store match data in JSON object
      matchHistoryJSON.games.push(jsonString);
      // write JSON object to file
      fs.writeFileSync("match-history.json", JSON.stringify(matchHistoryJSON));
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
