const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals: { GoalBlock } } = require('mineflayer-pathfinder');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

function createBot() {
  const bot = mineflayer.createBot({
    username: config['bot-account'].username,
    password: config['bot-account'].password || undefined,
    auth: config['bot-account'].type,
    host: config.server.ip,
    port: config.server.port,
    version: config.server.version
  });

  bot.loadPlugin(pathfinder);

  // Setup movements
  const mcData = require('minecraft-data')(bot.version);
  const movements = new Movements(bot, mcData);
  bot.pathfinder.setMovements(movements);

  // On spawn
  bot.on('spawn', () => {
    console.log('✅ Bot joined the server!');
    
    // Auto-auth (for offline server with plugin like AuthMe)
    if(config.utils['auto-auth'].enabled){
      const pwd = config.utils['auto-auth'].password;
      bot.chat(`/register ${pwd} ${pwd}`);
      bot.chat(`/login ${pwd}`);
      console.log('🔑 Auto-auth executed');
    }

// Anti-AFK random walking
if(config.utils['anti-afk'].enabled){

  function randomWalk(){
    const pos = bot.entity.position;

    const x = pos.x + Math.floor(Math.random() * 10 - 5);
    const y = pos.y;
    const z = pos.z + Math.floor(Math.random() * 10 - 5);

    const goal = new GoalBlock(x, y, z);
    bot.pathfinder.setGoal(goal);

    console.log(`🚶 Walking to ${x}, ${y}, ${z}`);

    // Walk again after some time
    setTimeout(randomWalk, 20000 + Math.random() * 15000);
  }

  setTimeout(randomWalk, 10000);
  console.log('🛡 Smart Anti-AFK walking enabled');
}


    // Chat messages
    if(config.utils['chat-messages'].enabled){
      let index = 0;
      setInterval(() => {
        const msg = config.utils['chat-messages'].messages[index];
        bot.chat(msg);
        index = (index + 1) % config.utils['chat-messages'].messages.length;
      }, config.utils['chat-messages']['repeat-delay'] * 1000);
      console.log('💬 Chat messages enabled');
    }
  });

  // Auto-reconnect
  if(config.utils['auto-reconnect']){
    bot.on('end', () => {
      console.log('⚠️ Bot disconnected, reconnecting...');
      setTimeout(createBot, config.utils['auto-reconnect-delay']);
    });
    bot.on('kicked', (reason) => {
      console.log('⚠️ Bot kicked: ', reason, '→ reconnecting...');
      setTimeout(createBot, config.utils['auto-reconnect-delay']);
    });
  }

  // Logging errors
  bot.on('error', (err) => console.log('❌ Bot error: ', err));
}

createBot();
