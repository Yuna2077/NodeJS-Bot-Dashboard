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

/*
 • • • • • • • • • • • • • • 
 HELPER
 • • • • • • • • • • • • • • 
*/
//#region HELPER
var SecondsToTime = function (n) {
  // Source - https://stackoverflow.com/a/1322771
  // Posted by Cleiton, modified by community. See post 'Timeline' for change history
  // Retrieved 2026-11-22, License - CC BY-SA 4.0
  return new Date(n * 1000).toISOString().substring(14, 19)
}
//#endregion

/*
 • • • • • • • • • • • • • • 
 HANDLE WINDOW
 • • • • • • • • • • • • • • 
*/

let window = new AppWindow();
window.ui_header_version = APP_VERSION;

window.request_bot_start = function() {
  window.ui_status_online="Starting...";
  try {
    client = run(BOT_TOKEN);
  } catch {
    window.ui_status_online="Failed to start.";
  };
  window.ui_status_online="Online";
}

window.request_bot_stop = function() {
  window.ui_status_online="Shutting Down...";
  try {
    shutdown(client);
  } catch {
    window.ui_status_online="Failed to shutdown.";
  };
  window.ui_status_online="Offline";
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
  window.ui_status_cpu =  Math.round((cpu.user/cpu.system) * 10) / 10 + "%";
  window.ui_status_app_uptime_counter = window.ui_status_app_uptime_counter + 1;
  window.ui_status_app_uptime = SecondsToTime(window.ui_status_app_uptime_counter);

  if (memory > parseInt(APP_LIMIT_MEMORY, 10)) {
    process.exit(1);
  };
}, 1000);

await window.run();