const path = require('path');
const nunjucks = require('nunjucks');

// Nunjucks settings & env
var settings, env;
// 模版中使用的Helper函数
var renderHelper = {};
var app;

/**
 * 向Koa context 注入 render 方法
 */
exports = module.exports = async function render(ctx, next) {

    // 区分于Layout以及子模块
    var main = true;

    /**
     * option = {
     *  name: 'template/path',
     * }
    */
    ctx.render = function (data, option) {

        const defaultView = path.join(ctx.routeInfo.controller, ctx.routeInfo.action);
        ctx.renderInfo = {
            view: (option && option.name) || defaultView,
            data: data || {}
        }

        if(main) {

            ctx.renderInfo.layout = option && option.layout ? option.layout : 'layout/index';
        }
    };

    await next();
};

exports.startup = function(_app) {

    app = _app, settings = app.settings.nunjucks,
        env = createEnv('views', {});
    
    const helper = require('../lib/render-helper');
    
    helper.startup(app);

    for(let name in  helper) {

        if(name != 'startup' && (typeof helper[name] == 'function')) {

            env.addFilter(name, helper[name], true);
        }
    }

    app.render = tryRender;
    app.safeString = safeString;
}

/**
 * 开始渲染流程
 * start render
*/
exports.start = async function (ctx, next) {

    const routeInfo = ctx.routeInfo, renderInfo = ctx.renderInfo;

    if(!renderInfo) return await next();

    // render main view
    // 渲染模版
    const view = await tryRender(ctx, renderInfo.view, renderInfo.data);

    await app.controllers['layout']['index'].call(ctx);

    // render layout
    // 渲染Layout
    const layout = await tryRender(ctx, renderInfo.layout, {
        content: safeString(view)
    })

    ctx.body = layout;

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
    context.ctx = ctx;

    return new Promise(function(reslove, reject) {

        env.render(templatePath, context, function(err, res) {

            if(!err) return reslove(res);
            reject(err);
        });
    });
}

/**
 * create Nunjucks's env
 */
function createEnv(path, options) {

    const autoescape = options.autoescape && true,
        noCache = options.noCache || false,
        watch = options.watch || false,
        throwOnUndefined = options.throwOnUndefined || false;

    return new nunjucks.Environment(new nunjucks.FileSystemLoader(path || 'views', {
        noCache: noCache,
        watch: watch,
    }), {
            autoescape: autoescape,
            throwOnUndefined: throwOnUndefined
        });
}

exports.level = 10;