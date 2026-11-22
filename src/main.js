// Import stuff
import { AppWindow } from "../ui/app-window.slint";
import { run, shutdown } from "./bot_source/index.js";
import {
  BOT_TOKEN,
  APP_VERSION,
  APP_LIMIT_MEMORY
} from "./env.js"; // i honestly dont know why i should use the dotenv "extension"


// Variables
let client = null;
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
  await c();
  debounces[n] = false;
};
//#endregion

/*
 • • • • • • • • • • • • • • 
 HANDLE WINDOW
 • • • • • • • • • • • • • • 
*/

let window = new AppWindow();
window.ui_header_version = APP_VERSION;

window.request_bot_start = async function (restart = false) {
  DebounceFunction("request_bot", async function () {
    if (client) return;
    if (!restart) window.ui_status_online = "Starting...";
    try { client = await run(BOT_TOKEN); } catch { window.ui_status_online = "Failed to start."; };
    if (!restart) window.ui_status_online = "Online";
  });
}

window.request_bot_stop = async function (restart = false) {
  DebounceFunction("request_bot", async function () {
    if (client) return;
    if (!restart) window.ui_status_online = "Stopping...";
    try { client = await shutdown(client); } catch { window.ui_status_online = "Failed to stop."; };
    if (!restart) window.ui_status_online = "Offline";
  });
}

window.request_bot_restart = async function (restart = false) {
  DebounceFunction("request_bot", async function () {
    window.ui_status_online = "Restarting...";
    if (client) await window.request_bot_stop(true);
    await window.request_bot_start(true);
    window.ui_status_online = "Online";
  });
}


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

  window.ui_status_memory = (memory.rss / 1024 / 1024).toFixed(2) + " MB";
  window.ui_status_cpu = Math.round((cpu.user / cpu.system) * 10) / 10 + "%";
  window.ui_status_app_uptime_counter = window.ui_status_app_uptime_counter + 1;
  window.ui_status_app_uptime = SecondsToTime(window.ui_status_app_uptime_counter);

  if (memory > parseInt(APP_LIMIT_MEMORY, 10)) {
    process.exit(1);
  };
}, 1000);

await window.run();