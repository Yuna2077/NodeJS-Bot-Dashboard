export default {
  data: {
    name: "ping",
    description: "Check your ping to the bot."
  },
  run: async function (interaction) {
    interaction.editReply("Pong!");
  }
}