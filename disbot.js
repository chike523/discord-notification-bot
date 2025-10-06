const { Client } = require("discord.js-selfbot-v13");
const { Client: BotClient, GatewayIntentBits } = require("discord.js");
const http = require('http');

// Simple health check server for Fly.io
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Discord Bot is running');
  }
});

server.listen(8080, '0.0.0.0', () => {
  console.log('✅ Health check server running on port 8080');
});

// Get configuration from environment variables
console.log('🔍 Environment variables check:');
console.log('BOT_TOKEN:', process.env.BOT_TOKEN ? 'SET' : 'NOT SET');
console.log('RECIPIENT_ID:', process.env.RECIPIENT_ID ? 'SET' : 'NOT SET');
console.log('USER_TOKEN:', process.env.USER_TOKEN ? 'SET' : 'NOT SET');
console.log('EMAIL:', process.env.EMAIL ? 'SET' : 'NOT SET');

const botInstances = [
  {
    botToken: process.env.BOT_TOKEN,
    recipientUserId: process.env.RECIPIENT_ID,
    userToken: process.env.USER_TOKEN,
    email: process.env.EMAIL,
  },
];

const validateConfig = (config) => {
  const missing = [];
  if (!config.botToken) missing.push('BOT_TOKEN');
  if (!config.recipientUserId) missing.push('RECIPIENT_ID');
  if (!config.userToken) missing.push('USER_TOKEN');
  if (!config.email) missing.push('EMAIL');
  
  if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  return true;
};

const initializeBot = ({ botToken, recipientUserId, userToken, email }) => {
  if (!validateConfig({ botToken, recipientUserId, userToken, email })) {
    process.exit(1);
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