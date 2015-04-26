let World = function(){};//require('prismarine-world');
let Event = require('./event.js');

let autorequire = function(obj) {
    for(let name in obj)
        obj[name] = require(name)(obj[name]);
};

class Server {

    constructor(implementations) {
        this.worlds = new Map();
        this.implementations = implementations;
    }

    addWorld(options) {
        let world = new World();

        this.worlds.set(cfg.name, world);
    }

    emit(event, data) {
        if(!Event.isValid(event))
            throw new Error(`Invalid event ID #${event}`);
        super.emit(event, data);
    }

}

module.exports.createServer = function(config) {
    config.modules = autorequire(config.modules);
    config.worlds.map(world => world.modules = autorequire(world.modules));

    let server = new Server();



    return server;
};
