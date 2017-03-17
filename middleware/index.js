const path = require('path');

/**
 * 加载 Mysrv 内置中间件
 */
module.exports = function(app) {

    const toLoad = [
        'static',
        'body',
        'session',
        'render',
        'router'
    ];

    for(let item of toLoad) {

        var middleware = require(`./${item}`);
        if(!middleware.level) middleware.level = 10;
        app.registerMiddleware(middleware);
    }
}