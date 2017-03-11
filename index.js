const path = require('path');
const fs = require('fs');
const koa = require('koa');
const config = require('./config-default');

class Application {

    constructor(appDir, settings) {

        do {

            settings = settings ? settings : {};
            if (!appDir) break;
            const settingDir = path.join(appDir, 'config');
            // new mysrv({option: value});
            if (typeof appDir == 'object') {

                settings = appDir;
                break;
            }
            if (fs.existsSync(settingDir)) settings = Object.assign(require(settingDir), settings);
        } while (0);

        this.settings = Object.assign(config, settings);
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

        for (let middleware of this.middlewares) {

            if (middleware.startup && (typeof middleware.startup == 'function')) {

                middleware.startup(this);
            }

            this.use(middleware);
        }

        this.server.listen(this.settings.port);

        setImmediate(() => {

            console.log(`listening on ${this.settings.port}`);
        });
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

        if (!middleware.level) middleware.level = 1;

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

    if(!fs.existsSync(componentsDir)) return;

    loadPlugins(app);
    loadMiddleware(app);
    loadServices(app);
}

function locateComponents(name) {

    const loadDir = path.join(componentsDir, name);
    if(fs.existsSync(loadDir)) {

        return fs.readdirSync(loadDir);
    }else{
        return [];
    }
}

function loadMiddleware(app) {

    const files = locateComponents('middlewares');

    for (let file of files) {

        app.registerMiddleware(require(path.join(componentsDir, 'middlewares', file)));
    }
}

function loadPlugins(app) {

    const files = locateComponents('plugins');

    for (let file of files) {

        require(path.join(componentsDir, 'plugins', file))(app);
    }
}

function loadServices(app) {

    const files = locateComponents('services');

    app.context.services = {};

    for (let file of files) {

        let name = file.replace('.js', '');
        let Service = require(path.join(componentsDir, 'services', file));
        app.context.services[name] = new Service(app);
    }
}

module.exports = Application;