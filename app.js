var mc = require('minecraft-protocol');
var states = mc.protocol.states;

var options = {
  motd: 'Bushido Studios',
  'max-players': 127,
  port: 25565,
  'online-mode': true,
};

var server = mc.createServer(options);

server.on('login', function(client) {
  broadcast(client.username+' joined the game.');
  var addr = client.socket.remoteAddress + ':' + client.socket.remotePort;
  console.log(client.username+' connected', '('+addr+')');

  client.on('end', function() {
    broadcast(client.username+' left the game.', client);
    console.log(client.username+' disconnected', '('+addr+')');
  });

  // send init data so client will start rendering world
  client.write('login', {
    entityId: client.id,
    levelType: 'default',
    gameMode: 1,
    dimension: 0,
    difficulty: 2,
    maxPlayers: server.maxPlayers
  });
  
  client.write('position', {
    x: 0,
    y: 256,
    z: 0,
    yaw: 0,
    pitch: 0,
    onGround: true
  });

  client.on('chat', function(data) {
    // var message = '<'+client.username+'>' + ' ' + data.message;
    // Send chat to message processor to decide what to do with it.
    console.log(data);
    console.log(server);
    messageHandler(data.message, client);
    // broadcast(message, null, client.username);
  });
});

server.on('error', function(error) {
  console.log('Error:', error);
});

server.on('listening', function() {
  console.log('Server listening on port', server.socketServer.address().port);
});

function messageHandler(message, client) { 
  if (message.split(" ")[0].indexOf('/') > -1) {
    var message = "It looks like you tried to use a command.";
    messageClient(message, client);
  } else {
    broadcast(message, null, client.username);
  }
}

function messageClient(message, client) {
  var server = "Server"
  
  var msg = {
    text: message,
    color: "red"
  };
  client.write(0x02, { message: JSON.stringify(msg) }, 2);
}

function broadcast(message, exclude, username) {
  var client, translate;
  translate = username ? 'chat.type.announcement' : 'chat.type.text';
  username = username || 'Server';
  for (var clientId in server.clients) {
    if (!server.clients.hasOwnProperty(clientId)) continue;

    client = server.clients[clientId];
    if (client !== exclude) {
      var msg = {
        translate: translate,
        "with": [
          username,
          message
        ]
      };
      client.write('chat', { message: JSON.stringify(msg) });
    }
  }
}
