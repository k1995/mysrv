const path = require('path');
const fs = require('fs');
const koa = require('koa');

class Application {

    constructor(appDir, settings) {

        const settingPath = path.join(appDir, 'config');
        const assetsPath = path.join(appDir, 'assets');
        this.settings = require(settingPath);
        this.settings.appDir = appDir;
        this.context = {};
        this.middlewares = [];
        this.server = new koa();
    }

    /**
     * start server
     */
    run() {

        loadSysCompoents(this);
        loadAppCompoents(this);

        // TODO: sortMiddleware();

        for(let middleware of this.middlewares) {

            if(middleware.startup && (typeof middleware.startup == 'function')) {

                middleware.startup(this);
            }

            this.use(middleware);
        }

        this.server.listen(this.settings.port);
    }

    /**
     * add middleware
     */
    use(middleware) {

        this.server.use(middleware);
    }

    /**
     * register middleware
     * 注册中间件
     * middleware.level 表示中间件的优先级
     * level 越大，优先级越高，优先执行。默认为 1
     */
    registerMiddleware(middleware) {

        if(!middleware.level) middleware.level = 1;

        this.middlewares.push(middleware);
    }
}

var componentsDir;

/**
 * 加载系统级组件
 */
function loadSysCompoents(app) {

    // 注册内置中间件
    require('./middleware')(app);
}

/**
 * 加载应用级组件
 */
function loadAppCompoents(app) {

    const appDir = app.settings.appDir;
    componentsDir = path.join(appDir, 'components');

    loadPlugins(app);
    loadMiddleware(app);
    loadServices(app);
}

function locateComponents(name) {

    const loadDir = path.join(componentsDir, name);
    return fs.readdirSync(loadDir);
}

function loadMiddleware(app) {

    const files = locateComponents('middlewares');

    for(let file of files){

        app.registerMiddleware(require(path.join(componentsDir, 'middlewares', file)));
    }
}

function loadPlugins(app) {

    const files = locateComponents('plugins');

    for(let file of files){

        require(path.join(componentsDir, 'plugins', file))(app);
    }
}

function loadServices(app) {

    const files = locateComponents('services');

    app.context.services = {};

    for(let file of files){
        
        let name = file.replace('.js', '');
        let Service = require(path.join(componentsDir, 'services', file));
        app.context.services[name] = new Service(app);
    }
}

module.exports = Application;