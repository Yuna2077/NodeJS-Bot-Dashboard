// import before doing anything
import { Client, GatewayIntentBits } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { loadModulesFromFolder } from "./utilities/loadModules.js";
import { log, logSave } from "../utils/eventlogs.js";

// variables
var modules = null;
var DISCORD_ERRORS = {
  UNKNOWN_INTERACTION: 10062,
  INTERACTION_ALREADY_ACKNOWLEDGED: 40060
};

/**
 * Startup the bot
 * @param {string} token - Token of the bot.
 * @return {{ client: Client, restClient: RestClient}} Returns client + restClient of the bot.
*/
export async function run(token) {
  log("Attempting to run bot");
  // main login stuff
  var client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  log("- Creating restClient");
  var restClient = new REST({ version: "10" }).setToken(token);

  log("- Attempting to log in");
  try {
    await client.login(token);
  } catch (err) {
    console.error("Bot failed to start with error:\n" + err);
    log("- Loggin failed with error:\n" + err);
    logSave();
    throw err;
  };

  // load modules
  log("- Gathering command modules");
  modules = await loadModulesFromFolder("./src/bot_source/commands");
  log("- - Loaded " + modules.lenght + " modules");

  // handle interactions
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.user.bot) return;

    try {
      await interaction.deferReply();
    } catch (err) {
      if (err.code === DISCORD_ERRORS.UNKNOWN_INTERACTION || err.code === DISCORD_ERRORS.INTERACTION_ALREADY_ACKNOWLEDGED) {
        interaction.editReply({ content: "Interaction expired or was already handled.", flags: 64 });
        console.log(`${interaction.user.tag} interaction expired or was already handled.`);
        return;
      }

      console.error("Critical error during deferral:", err);
      return;
    };

    var commandModule = modules[interaction.commandName];

    try {
      var timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Command timeout")), 10000)
      );

      await Promise.race([
        commandModule.run(interaction),
        timeoutPromise
      ])

    } catch (err) {
      console.error(`Error executing command ${interaction.commandName}:`, err);

      await interaction.editReply({ content: "Command errored while trying to process, please try later again!\n" + err, flags: 64 });
    };
  });
  log("- Listening to 'interactionCreate'")
  log("- Successfully run the bot.")

  return {
    client: client,
    restClient: restClient
  };
}

/**
 * Puts up commands using the restClient
 * @param {restClient} - Restclient returned after using the run function.
 * @return {null}
*/
export async function put_commands(restClient, clientId) {
  log("Attempting to put commands")
  var formatted = Object.values(modules).map(cmd => ({
    ...cmd.data,

    // Allow command usage in DMs and user installs
    // Note 11.2026 - I am too lazy to remove this so ill just make the bot installable via guild only.
    dm_permission: false,
    integration_types: [0, 1], // Guild install + User install
    contexts: [0, 1, 2]       // Guilds + Bot DMs + Group DMs
  }));

  try {
    restClient.put(
      Routes.applicationCommands(clientId),
      { body: formatted }
    );
  } catch(err) {
    log("- Failed to put commands with error:\n" + err);
    logSave();
    throw err;
  };
};

/**
 * @param {Client} client - The client returned after using the run function.
 * @returns {null}
*/
export async function shutdown(client) {
  log("Attempting to shutdown client");
  try {
    await client.destroy();
  } catch(err) {
    log("- Failed shutdown client with error:\n" + err);
    logSave();
    throw err;
  }
};