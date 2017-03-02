const router = require('koa-router')();
const fs = require('fs'), path = require('path');
const render = require('./render');

class Router {

    constructor(app) {

        this.app = app;
        this.settings = app.settings;

        app.use(router.routes());

        app.controllers = this.controllers = app.server.context.controllers = this.__loadController();

        for(let name in this.controllers) {

            this.__route(name);
        }
    }

    /**
     * 加载 Controller
     */
    __loadController() {

        const controllerDir = path.join(this.settings.appDir, 'components/controllers');
        const maybe = fs.readdirSync(controllerDir);
        const controllers = {};
   
        for(let i in maybe) {

            const fileName = maybe[i];
            const controllerName = fileName.replace('.js', '');
            const Controller = require(path.join(controllerDir, fileName));
            controllers[controllerName] = Controller;
        }

        return controllers;
    }

    /**
     * 建立路由
     */
    __route(controllerName) {

        const Controller = this.controllers[controllerName];

        const props = typeof Controller == 'function' ? Object.getOwnPropertyNames(Controller.prototype) : Object.keys(Controller);

        for (let prop of props) {

            const action = typeof Controller == 'function' ? Controller.prototype[prop] : Controller[prop];

            if (prop == 'constructor' || ('function' != (typeof action))) {

                continue;
            }

            const actionName = prop, conf = this.__getHint(action);

            // 默认处理所有method类型
            var method = 'all', url = '';

            method = conf['method'] ? conf['method'] : method;

            if (conf['url']) {

                let tmp = conf['url'].split(' ');
                /**
                 * GET /url 
                 */
                if (tmp.length > 1) {

                    method = tmp[0];
                    url = tmp[1];
                } else {
                    url = conf['url'];
                }
            }

            // 没有配置路由，采用默认映射关系
            if(!url) {

                if(actionName == 'index') {

                    url = `/${controllerName}`;

                    if(controllerName == 'index') {

                        url = '/'
                    }
                }else{

                    url = `/${controllerName}/${actionName}`;
                }
            }

            method = method.toLowerCase();

            const self = this;

            router[method](url, function* (next) {

                this.params = Object.assign(this.query, this.request.fields || {});
                
                this.routeInfo = {
                    controller: controllerName,
                    action: actionName
                }

                for(let name in self.app.context.services) {

                    this[name] = self.app.context.services[name];
                }

                yield action.call(this);
                yield next;

            }, self.app.render.start());
        }
    }

    /**
     * 从Contoller的默认参数中，获取URL配置信息。类似于Java注解，例如：
     * 
     * function(arg, $url = '/', $method = 'GET') { ... }
     * 
     * $url 为映射的URL路径, $method 为接受的请求类型
     */
    __getHint(fn) {

        const settings = this.settings;

        var str = fn.toString();
        var args = fn.toString().slice(str.indexOf('(') + 1, str.indexOf(')')).split(',');
        if (!args) { return null }

        var result = {};

        for (let i of args) {

            i = i.trim();
            if (i.startsWith(settings.hintSign)) {

                let tmp = i.split('=');
                let name = tmp[0].trim().replace(settings.hintSign, '').toLowerCase();
                let value = tmp[1].trim().replace(/'/g, '').replace(/"/g, '');
                result[name] = value;
            }
        }

        return result;
    }
}

module.exports = Router;