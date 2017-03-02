const path = require('path'), server = require('koa')();
const fs = require('fs');
const Render = require('./render'), Router = require('./router');
const send = require('koa-send');
const body = require('koa-better-body');

class Core {

    constructor(appDir, settings) {

        const settingPath = path.join(appDir, 'config');
        const assetsPath = path.join(appDir, 'assets');
        this.settings = require(settingPath);
        this.settings.appDir = appDir;
        this.context = {};

        this.server = server;

        this.use(staticServer(appDir));

        this.use(body())

        loadPlugins(this);

        loadMiddleware(this);
        loadServices(this);

        this.use(render);

        this.render = server.context.render = new Render(this);
        this.router = server.context.router = new Router(this);

        server.listen(this.settings.port);
    }

    /**
     * 添加Koa中间件
     */
    use(middleware) {

        this.server.use(middleware);
    }
}

exports.run = function (appDir) {

    return new Core(appDir)
}

/**
 * 向Koa context 注入 render 方法
 */
function* render(next) {

    // 区分于Layout以及子模块
    var main = true;

    /**
     * option = {
     *  name: 'template/path',
     * }
    */
    this.render = function (data, option) {

        const defaultView = path.join(this.routeInfo.controller, this.routeInfo.action);
        this.renderInfo = {
            view: (option && option.name) || defaultView,
            data: data || {}
        }

        if(main) {

            this.renderInfo.layout = option && option.layout ? option.layout : 'layout/index';
        }
    };

    yield next;
};


/**
 * 处理静态资源
 */
function staticServer(appDir) {

    const assetsRoot = path.join(appDir, 'assets');
    const files = fs.readdirSync(assetsRoot);

    return function* (next) {

        for (let file of files) {

            var maybe = this.path.replace('/', '');
            var tmp = maybe.split('/');
            
            // 判断文件夹或文件
            if(tmp[0] == file) {

                yield send(this, this.path, { root: assetsRoot });
                return;
            }
        }

        yield next;
    }
}

function loadMiddleware(app) {

    const middlewareDir = path.join(app.settings.appDir, 'components/middlewares');
    const files = fs.readdirSync(middlewareDir);

    for(let file of files){

        app.use(require(path.join(middlewareDir, file)));
    }
}

function loadPlugins(app) {

    const pluginDir = path.join(app.settings.appDir, 'components/plugins');
    const files = fs.readdirSync(pluginDir);

    for(let file of files){

        require(path.join(pluginDir, file))(app);
    }
}

function loadServices(app) {

    const loadDir = path.join(app.settings.appDir, 'components/services');
    const files = fs.readdirSync(loadDir);

    app.context.services = {};

    for(let file of files){
        
        let name = file.replace('.js', '');
        let Service = require(path.join(loadDir, file));
        app.context.services[name] = new Service(app);
    }
}