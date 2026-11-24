// Import stuff
import { AppWindow } from "../ui/app-window.slint";
import { run, shutdown, put_commands } from "./bot_source/index.js";
import { log, logReset, logSave, getLogsStringed, listenOnLog, getLogsRaw, getLogsStringedReversed } from "./utils/eventlogs.js";
import {
  BOT_TOKEN,
  BOT_CLIENT_ID,
  APP_VERSION,
  APP_LIMIT_MEMORY
} from "./env.js"; // i honestly dont know why i should use the dotenv "extension"


// Variables
let client = null;
let restClient = null;
let debounces = [];

/*
 • • • • • • • • • • • • • • 
 HELPER
 • • • • • • • • • • • • • • 
*/
//#region HELPER
/**
 * Converts seconds into a more readable time string.
 * @param {number} n - Seconds
 * @return {string}
*/
var SecondsToTime = function (n) {
  // Source - https://stackoverflow.com/a/1322771
  // Posted by Cleiton, modified by community. See post 'Timeline' for change history
  // Retrieved 2026-11-22, License - CC BY-SA 4.0
  return new Date(n * 1000).toISOString().substring(14, 19)
};

/**
 * Debounces a function easely
 * @param {string} n - The debounce key.
 * @param {callback} c - Callback that willbe called if theres no active debounce.
 * @return {null} 
*/
var DebounceFunction = async function (n, c) {
  if (debounces[n]) return;
  debounces[n] = true;
  try {
    await c()
  } finally {
    debounces[n] = false;
  };
};
//#endregion

/*
 • • • • • • • • • • • • • • 
 HANDLE WINDOW
 • • • • • • • • • • • • • • 
*/
log("Setting up window");
let window = new AppWindow();
window.ui_header_version = APP_VERSION;

log("- Setting up window commands.");
window.request_bot_start = async function (restart = false) {
  log("Request bot start.");
  log("- Is restart: " + restart);
  if (client !== null) return log("- Request failed, client is already present.");
  DebounceFunction("request_bot", async function () {
    if (!restart) window.ui_status_online = "Starting...";
    try {
      log("- Attempting to start.");
      var returned = await run(BOT_TOKEN);
      client = returned.client;
      restClient = returned.restClient;
      window.bot_online = true;
      log("- Successfully started.");
      if (!restart) window.ui_status_online = "Online";
    } catch(err) {
      log("- Failed to start: " + err);
      logSave();
      throw err;
    };
  });
}

window.request_bot_stop = async function (restart = false) {
  log("Request bot stop.");
  log("- Is restart: " + restart);
  if (client === null) return log("- Request failed, no client found.");
  DebounceFunction("request_bot", async function () {
    if (!restart) window.ui_status_online = "Stopping...";
    try {
      log("- Attempting to stop.");
      client = await shutdown(client);
      client = null;
      restClient = null;
      window.bot_online = false;
      log("- Successfully stopped.");
      if (!restart) window.ui_status_online = "Offline";
      logSave();
    } catch(err) {
      log("- Failed to stop: " + err);
      logSave();
      throw err;
    };
  });
}

window.request_bot_restart = async function () {
  log("Request bot restart.");
  DebounceFunction("request_bot", async function () {
    window.ui_status_online = "Restarting...";
    log("- Attempting to restart.");
    if (client) await window.request_bot_stop(true);
    await window.request_bot_start(true);
    window.ui_status_online = "Online";
    log("- Successfully restarted.");
  });
}


window.request_bot_put_commands = async function () {
  log("Request bot put commands.");
  if (client === null) return;
  DebounceFunction("request_bot", async function () {
    try {
      log("- Attemting to put commands.");
      await put_commands(restClient, BOT_CLIENT_ID);
      window.ui_status_online = "Online";
      log("- Successfully put commands.");
    } catch(err) {
      log("- Failed to put commands: " + err);
      logSave();
      throw err;
    };
  });
}

/*
 • • • • • • • • • • • • • • 
 INFO DISPLAY
 • • • • • • • • • • • • • • 
*/
log("- Setting up window info display.");
window.ui_status_memory = "Loading...";
window.ui_status_cpu = "Loading...";

setInterval(() => {
  var memory = process.memoryUsage();
  var cpu = process.cpuUsage();

  window.ui_status_memory = (memory.rss / 1024 / 1024).toFixed(2) + " MB";
  window.ui_status_cpu = Math.round((cpu.user / cpu.system) * 100) / 100 + "%";

  window.ui_status_app_uptime_counter = window.ui_status_app_uptime_counter + 1;
  window.ui_status_app_uptime = SecondsToTime(window.ui_status_app_uptime_counter);

  window.ui_status_bot_uptime_counter = (client) ? window.ui_status_bot_uptime_counter + 1 : 0;
  window.ui_status_bot_uptime = SecondsToTime(window.ui_status_bot_uptime_counter);

  if (memory > parseInt(APP_LIMIT_MEMORY, 10)) {
    process.exit(1);
  };
}, 1000);
log("- - Started info display loop.");

listenOnLog(function() { window.ui_log = getLogsStringedReversed(5); });
log("- - Started info display log listener");


log("- Starting window.");
await window.run();