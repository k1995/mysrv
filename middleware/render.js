const path = require('path');
const nunjucks = require('nunjucks');
const assetHelper = require('../lib/asset-helper');

// Nunjucks settings & env
var settings, env;
var app;

/**
 * 向Koa context 注入 render 方法
 */
exports = module.exports = function (_app) {

    app = _app, settings = app.settings.nunjucks;
    env = createEnv(path.join(app.settings.appDir, 'views'));

    env.addExtension('renderExtension', new RenderExtension());
    env.addGlobal('assets', assetHelper);

    app.render = tryRender;
    app.safeString = safeString;

    return async function render(ctx, next) {

        // 区分于Layout以及子模块
        var main = true;

        /**
         * option = {
         *  layout: 'controller:action',
         * }
        */
        ctx.render = function (data, option) {

            const defaultView = path.join(ctx.routeInfo.controller, ctx.routeInfo.action);
            ctx.renderInfo = {
                view: (option && option.name) || defaultView,
                data: data || {}
            }

            if (main) {

                let layout = {};
                if (this.layout) layout = this.layout;
                if (option && option.layout !== undefined) {

                    if (!option.layout) {

                        layout = { enable: false };
                    }else{
                        layout = option.layout;
                    }
                }
                ctx.renderInfo.layout = Object.assign({}, app.settings.layout, layout);
                main = false;
            }
        };

        await next();
    };
}

/**
 * {% render %} custom tag
 */
function RenderExtension() {

    this.tags = ['render'];

    this.parse = function (parser, nodes, lexer) {
        // get the tag token
        var tok = parser.nextToken();

        // parse the args and move after the block end. passing true
        // as the second arg is required if there are no parentheses
        var args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);

        // See above for notes about CallExtension
        return new nodes.CallExtensionAsync(this, 'run', args);
    };

    this.run = function (self, url, data, callback) {

        var ctx = self.ctx.$ctx;
        if (!callback) callback = data;
        var tmp = url.split(':'), controller, action;

        if (tmp.length > 1) {

            controller = tmp[0];
            action = tmp[1];
        } else {
            controller = tmp[0];
            action = 'index';
        }

        runAction(ctx, controller, action)
            .then(() => {
                data = Object.assign(data || {}, ctx.renderInfo.data || {});
                app.render(ctx, `${controller}/${action}`, data).then((content) => {
                    callback(null, app.safeString(content));
                });
            });
    }
}

/**
 * 开始渲染流程
 * start render
*/
exports.start = async function (ctx, next) {

    const routeInfo = ctx.routeInfo, renderInfo = ctx.renderInfo;

    if (!renderInfo) return await next();

    var mainViewData = renderInfo.data;

    // render main view
    // 渲染模版
    const view = await tryRender(ctx, renderInfo.view, mainViewData);
    const layout = renderInfo.layout;

    if (layout.enable) {

        if(layout.run) {

            let tmp = layout.name.split(':');
            await runAction(ctx, tmp[0], tmp[1]);
        }

        // 主视图中的数据会覆盖布局模版中同名的
        var data = Object.assign(ctx.renderInfo.data, mainViewData, {
            $view: safeString(view)
        });

        // render layout
        // 渲染Layout
        const content = await tryRender(ctx, layout.path, data);

        ctx.body = content;
    } else {
        ctx.body = view;
    }

    await next();
}

/**
 * 返回原样字符串，不会被模版引擎转义
 */
function safeString(string) {

    return env.getFilter('safe')(string);
}

/**
 * 渲染模版
 */
function tryRender(ctx, uri, data) {

    const suffix = settings.suffix || 'njk';
    const templatePath = uri + `.${suffix}`;
    var context = Object.assign({}, ctx.state || {}, data);
    context.$ctx = ctx;

    return new Promise(function (reslove, reject) {

        env.render(templatePath, context, function (err, res) {

            if (!err) return reslove(res);
            reject(err);
        });
    });
}

/**
 * create Nunjucks's env
 */
function createEnv(path) {

    return new nunjucks.Environment(new nunjucks.FileSystemLoader(path || 'views', {
        noCache: settings.noCache,
        watch: settings.watch,
    }), {
        autoescape: settings.autoescape,
        throwOnUndefined: settings.throwOnUndefined
    });
}

async function runAction(ctx, controller, action) {

    const Controller = app.controllers[controller];
    var func;

    if (typeof Controller == 'function') {

        func = Controller.prototype[action];
    } else {
        func = Controller[action];
    }

    // function is implicitly wrapped in Promise.resolve
    return func.call(ctx);
}