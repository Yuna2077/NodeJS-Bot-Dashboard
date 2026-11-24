/**
 * eventlogs - V1 - ©2026 Yuna2077
 * made by @Yuna2077
*/


import { writeFile, appendFile, open, write } from "fs";
import { EventEmitter } from "node:events";
import { appendFileSync, existsSync } from "node:fs";

class MyEmitter extends EventEmitter {};

var logs = [];
var logEmitter = new MyEmitter();

/**
 * Returns the log as an array containing all logged strings.
 * @returns {[string]}
 */
export function getLogsRaw() {
  return logs;
};

/**
 * Returns the log as an string in reversed.
 * @param {number} n How many entries should be used to create the string.
 * @returns {string}
*/
export function getLogsStringedReversed(n) {
  var l = logs.lenght;
  if (!n) n = l;
  return logs.reverse().slice(0, n).join("\n");
};

/**
 * Returns the log as an string.
 * @param {number} n How many entries should be used to create the string.
 * @returns {string}
*/
export function getLogsStringed(n) {
  var l = logs.lenght;
  if (!n) n = l;
  return logs.reverse().slice(0, n).reverse().join("\n");
};

/**
 * Lets you listen via a function to every log change.
 * @param {Function} c The function.
 * @returns {void}
*/
export function listenOnLog(c) {
  logEmitter.addListener("onLog", c);
};

/**
 * Adds a string to the existing logs.
 * @param {string} s String
 * @returns {void}
*/
export function log(s) {
  logs.push(s);
  logEmitter.emit("onLog");
};

/**
 * Saves the current logs to a file.
 * @returns {void}
*/
export function logSave() {
  log("Saving logs");

  var str = getLogsStringed();
  var date = new Date();
  var nameStr = [date.getFullYear(),"-", date.getMonth(), "-", date.getDay()].join("");

  let attempts = 0;
  var saveTo = "./src/logs/";
  var format = ".txt"
  var name = saveTo+nameStr+format;

  function trySave() {
    if (!existsSync(name)) {
      writeFile(name, str, { flag: "w" }, function(err) { if (err) throw err; })
    } else {
      attempts++;
      name = saveTo + nameStr + "-" + attempts + format;
      trySave();
    }
  };
  trySave();
};

/**
 * Resets the logs.
 * @returns {void}
*/
export function logReset() {
  logs.length = 0;
};