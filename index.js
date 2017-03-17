const path = require('path');
const fs = require('fs');
const koa = require('koa');
const middleware = require('./middleware');
const component = require('./component');
const config = require('./config-default');

class Application {

    constructor(appDir, settings) {

        // get settings
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

        // register system middlewares
        middleware(this);
        // load application components
        component(this);
    
        // TODO: sortMiddleware();

        for (let middleware of this.middlewares) {

            this.use(middleware(this));
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
     * middleware.level 表示中间件的优先级
     * level 越大，优先级越高，优先执行。默认为 1
     */
    registerMiddleware(middleware) {

        if (!middleware.level) middleware.level = 1;

        this.middlewares.push(middleware);
    }
}

module.exports = Application;