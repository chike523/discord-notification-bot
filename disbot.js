const { Client } = require("discord.js-selfbot-v13");
const { Client: BotClient, GatewayIntentBits } = require("discord.js");

// Get configuration from environment variables
const botInstances = [
  {
    botToken: process.env.BOT_TOKEN,
    recipientUserId: process.env.RECIPIENT_ID,
    userToken: process.env.USER_TOKEN,
    email: process.env.EMAIL,
  },
];

// Validate required environment variables
const validateConfig = (config) => {
  const missing = [];
  if (!config.botToken) missing.push('BOT_TOKEN');
  if (!config.recipientUserId) missing.push('RECIPIENT_ID');
  if (!config.userToken) missing.push('USER_TOKEN');
  if (!config.email) missing.push('EMAIL');
  
  if (missing.length > 0) {
    console.error(`Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  return true;
};

const initializeBot = ({ botToken, recipientUserId, userToken, email }) => {
  if (!validateConfig({ botToken, recipientUserId, userToken, email })) {
    return;
  }

  const botClient = new BotClient({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
  });

  botClient.once("ready", () => {
    console.log(`✅ Bot logged in as ${botClient.user.tag}`);
  });

  botClient.login(botToken).catch((error) => {
    console.error("❌ Bot failed to log in:", error);
  });

  const client = new Client();

  client.on("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag} on account ${email}!`);
  });

  client.on("guildMemberAdd", async (member) => {
    try {
      const welcomeMessage = `🚨 ${member.user.tag} has joined the server ${member.guild.name}`;
      const user = await botClient.users.fetch(recipientUserId);
      await user.send(welcomeMessage);
      console.log(`📨 Sent notification for ${member.user.tag} joining ${member.guild.name}`);
    } catch (error) {
      console.error(`❌ Failed to send DM for ${email}:`, error);
    }
  });

  client.login(userToken).catch((error) => {
    console.error(`❌ Failed to log in with token for account ${email}:`, error);
  });
};

// Start the bot
botInstances.forEach(initializeBot);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down bot...');
  process.exit(0);
});