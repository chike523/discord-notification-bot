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

const botToken = process.env.BOT_TOKEN;
const recipientUserId = process.env.RECIPIENT_ID;

if (!botToken || !recipientUserId) {
  console.error('❌ Missing required environment variables: BOT_TOKEN, RECIPIENT_ID');
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

botClient.on("guildMemberAdd", async (member) => {
  try {
    const welcomeMessage = `🚨 ${member.user.tag} has joined the server ${member.guild.name}`;
    
    // Try to send DM first
    try {
      const user = await botClient.users.fetch(recipientUserId);
      await user.send(welcomeMessage);
      console.log(`📨 Sent DM notification for ${member.user.tag} joining ${member.guild.name}`);
    } catch (dmError) {
      console.log(`⚠️ Could not send DM (${dmError.message}), trying to send to general channel...`);
      
      // Try to send to a general channel as fallback
      try {
        const channel = member.guild.channels.cache.find(ch => 
          ch.type === 0 && ch.name.includes('general')
        ) || member.guild.channels.cache.find(ch => 
          ch.type === 0 && ch.permissionsFor(botClient.user).has('SendMessages')
        );
        
        if (channel) {
          await channel.send(welcomeMessage);
          console.log(`📨 Sent channel notification for ${member.user.tag} joining ${member.guild.name}`);
        } else {
          console.log(`❌ No suitable channel found to send notification`);
        }
      } catch (channelError) {
        console.error(`❌ Failed to send channel notification:`, channelError.message);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to process member join:`, error);
  }
});

botClient.login(botToken).catch((error) => {
  console.error("❌ Bot failed to log in:", error);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down bot...');
  process.exit(0);
});