// import before doing anything
import { Client, GatewayIntentBits } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

/**
 * Startup the bot
 * @param {string} token - Token of the bot.
 * @return {Client, RestClient} Returns client + restClient of the bot.
*/
export function run(token) {
  var client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  var restClient = new REST({ version: "10" }).setToken(token);

  try {
    client.login(token);
  } catch(err) {
    console.error("Bot failed to start with error:\n" + err);
    return false;
  };

  return client, restClient
}

/**
 * @param {Client} client - The client returned after using the run function.
 * @returns {null}
*/
export function shutdown(client) {
  client.destroy();
};