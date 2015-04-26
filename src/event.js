let events = [
    'CHAT',
    'PLAYER_JOIN',
    'PLAYER_LEAVE',
    'ENTITY_MOVE',
    'ENTITY_HEALTH_UPDATE',
    'BLOCK_PLACE',
    'BLOCK_BREAK',
    'BLOCK_RANDOM_UPDATE'
];

let id = 0;
events.map(name => module.exports[name] = id++);

module.exports.isValid = function(event) {
    return event >=0 && event <= events.length - 1;
};
