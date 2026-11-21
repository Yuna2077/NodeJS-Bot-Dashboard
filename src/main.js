import { AppWindow } from "../ui/app-window.slint";
import { Client, GatewayIntentBits } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";


/*
 • • • • • • • • • • • • • • 
 CONFIG
 • • • • • • • • • • • • • • 
*/

var config = {
  bot: {
    status: {
      name: "Gathering Informations...",
      type: "Playing", // Playing, Listening
      status: "online" // online, offline, dnd
    },
    memory_limit: 2048 // 2gb should be enough for most bots
  },
  app: {
    version: "26.11"
  }
};

/*
 • • • • • • • • • • • • • • 
 HANDLE WINDOW
 • • • • • • • • • • • • • • 
*/

let window = new AppWindow();
window.ui_header_version = config.app.version;

window.request_bot_toggle = function () {
  var token = window.token;
  if (token === "No token set.") return;
  try {
    bot.login(token);
  } catch (err) {
    return
  };

  // Startup bot
  var rest_client = new REST({ version: '10' }).setToken(token);
}

//#region bot setup
var bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
bot.once('clientReady', async () => {
  window.ui_status_online = true;
  bot.user.setPresence({
    activities: [{
      name: config.bot.status.name,
      type: config.bot.status.type
    }],
    type: config.bot.status.status
  });

  setInterval(() => {
    var memory = process.memoryUsage;

    if (memory > config.bot.memory_limit) {
      process.exit(1);
    };
  }, 10000);
});
//#endregion


/*
 • • • • • • • • • • • • • • 
 INFO DISPLAY
 • • • • • • • • • • • • • • 
*/
window.ui_status_memory = "Loading...";
window.ui_status_cpu = "Loading...";

setInterval(() => {
  var memory = process.memoryUsage();
  var cpu = process.cpuUsage();

  window.ui_status_memory = "mem: " + (memory.rss / 1024 / 1024).toFixed(2) + " MB";
  window.ui_status_cpu =  "cpu: " +  Math.round((cpu.user/cpu.system) * 10) / 10 + "%";

  if (memory > config.bot.memory_limit) {
    process.exit(1);
  };
}, 1000);

await window.run();