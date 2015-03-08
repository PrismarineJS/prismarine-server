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
        maxPlayers: server.maxPlayers,
        reducedDebugInfo: false // We're gonna need every bit of debug info we can get
    });

    client.write('position', {
        x: 0,
        y: 256,
        z: 0,
        yaw: 0,
        pitch: 0,
        flags: 0
    });

    client.on('chat', function(data) {
        // var message = '<'+client.username+'>' + ' ' + data.message;
        // Send chat to message processor to decide what to do with it.
        messageHandler(data.message, client);

        // broadcast(message, null, client.username);
    });
});

server.on('error', function(error) {
    console.log('Error:', error);
});

server.on('listening', function() {
    console.log('Server listening on port', server.socketServer.address().port);
    startTicks();
});

function startTicks() {
    server.ticks = 0;
    setInterval(function() {
        server.ticks++;
    }, 50);
}

function messageHandler(message, client) {
    if (message.split(" ")[0].indexOf('/') > -1) {
        runCommand(message, client, function(response) {
            messageClient(response, client);
        });
    } else {
        broadcast('chat', { message: message }, null, client.username);
    }
}

function encodeChunk(chunk) {
    // 16 vertical 16x16x16 chunks, 3 bytes per block. 256 bytes of biome data
    var buf = new Buffer(((16 * 16 * 16) * 16 * 3) + 256);
    var cursor = 0;

    // 16x16x16 chunks
    for(var n=0; n<16; n++) {
        // block types
        for(var y=0; y<16; y++) {
            for(var z=0; z<16; z++) {
                for(var x=0; x<16; x++) {
                    var block = chunk.getBlock(x, y + (n * 16), z);
                    buf.writeUInt16LE((block.id << 4) | block.data, cursor);
                    cursor += 2;
                }
            }
        }
        // block light
        for(var y=0; y<16; y++) {
            for(var z=0; z<16; z++) {
                for(var x=0; x<16; x += 2) {
                    var blockLight   = 0; // getBlock(x,     y + (n * 16), z).blockLight
                    var blockLight2  = 0; // getBlock(x + 1, y + (n * 16), z).blockLight

                    buf.writeUInt8((blockLight << 4) | blockLight2, cursor);
                    cursor++;
                }
            }
        }
        // sky light
        for(var y=0; y<16; y++) {
            for(var z=0; z<16; z++) {
                for(var x=0; x<16; x += 2) {
                    var skyLight   = 7; // getBlock(x,     y + (n * 16), z).skyLight
                    var skyLight2  = 7; // getBlock(x + 1, y + (n * 16), z).skyLight

                     buf.writeUInt8((skyLight << 4) | skyLight2, cursor);
                    cursor++;
                }
            }
        }
    }
    // biome data
    for(var z=0; z<16; z++) {
        for(var x=0; x<16; x++) {
            buf.writeUInt8(21, cursor); // TODO: Biome data
            cursor++;
        }
    }
    return buf;
}

function runCommand(message, client, callback) {
    var message = message.split(" ");
    var response = "It looks like you tried to use a command.";
    console.log(message);
    if (message[0] == "/setTime") {
        setServerTime(message[1]);
        broadcast(client.username+" changed the time.");
    }
    if (message[0] == "/addExp") {
        client.write(0x1F, '0.5', '3', '37');
    }
    if (message[0] == "/mode") {
        client.write("game_state_change", { reason: '3', gameMode: message[1] });
    }
    if (message[0] == "/ticks") {
        broadcast(client.username+" asked to look at bugs!!!");
        messageClient(server.ticks, client);
    }
    callback(response);
}

function setServerTime(time) {
    broadcast({ age: [0, 0] , time: [0, time] }, null, null, "update_time");
}


function messageClient(message, client) {
    var server = "Server"

    var msg = {
        text: message,
        color: "red"
    };
    client.write(0x02, { message: JSON.stringify(msg) }, 2);
}

function broadcast(data, exclude, username, packet) {
    var client, translate;
    var packet = (typeof packet !== "undefined") ? packet : 'chat';
    translate = !username ? 'chat.type.announcement' : 'chat.type.text';
    username = username || 'Server';
    for (var clientId in server.clients) {
        if (!server.clients.hasOwnProperty(clientId)) continue;

        client = server.clients[clientId];
        if (packet == 'chat') {
            if (client !== exclude) {
                var msg = {
                    translate: translate,
                    "with": [
                        username,
                        data
                    ]
                };
                client.write('chat', { message: JSON.stringify(msg), position: 0 });
            }
        } else {
            client.write(packet, data);
        }
    }
}
