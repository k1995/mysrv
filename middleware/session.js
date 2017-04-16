const session = require("koa-session2");

module.exports = function(app) {
    
    return session(app.settings.session);
}

module.exports.level = 99;