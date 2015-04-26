let World = function(){};//require('prismarine-world');

let autorequire = function(obj) {
    for(let name in obj)
        obj[name] = require(name)(obj[name]);
};

class Server {

    constructor() {
        this.worlds = new Map();
        this.implementations = new Map();
    }

    addWorld(options) {
        let world = new World();

        this.worlds.set(cfg.name, world);
    }

}

module.exports.createServer = function(config) {
    config.modules = autorequire(config.modules);

    for(let slot in config.implementations)
        

    config.worlds.map(world => world.modules = autorequire(world.modules));



    let server = new Server();



    return server;
};
