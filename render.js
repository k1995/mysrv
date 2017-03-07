const nunjucks = require('nunjucks');
const path = require('path');

class Render {

    constructor(app) {

        this.app = app;
        this.settings = app.settings.nunjucks;
        //create Nunjucks's env
        this.env = createEnv('views', {});

        const renderHelper = require('./render-helper');
        renderHelper.startup(app);
        this.renderHelper = {};

        for(let name in  renderHelper) {

            if(name != 'startup' && (typeof renderHelper[name] == 'function')) {

                this.renderHelper[name] = renderHelper[name];
            }
        }
    }

    /**
     * 开始渲染流程
     * start render
     */
    start() {

        const self = this;

        return async function (ctx, next) {

            const routeInfo = ctx.routeInfo, renderInfo = ctx.renderInfo;

            if(!renderInfo) return await next();

            // render main view
            // 渲染模版
            const view = self.renderTmplate(ctx, renderInfo.view, renderInfo.data);

            // TODO
            await self.app.controllers['layout']['index'].call(ctx);

            // render layout
            // 渲染Layout
            const layout = self.renderTmplate(ctx, renderInfo.layout, {
                content: self.safeString(view)
            })

            ctx.body = layout;

            await next();
        }
    }

    /**
     * 返回原样字符串，不会被模版引擎转义
     */
    safeString(string) {

        return this.env.getFilter('safe')(string);
    }

    /**
     * 渲染模版
     */
    renderTmplate(ctx, uri, data) {

        for(let name in this.renderHelper) {

            this.renderHelper[name] = this.renderHelper[name].bind(ctx);
        }

        var helpers = {

            $: this.renderHelper
        }

        const suffix = this.settings.suffix || 'njk';
        const templatePath = uri + `.${suffix}`;

        var context = Object.assign({}, ctx.state || {}, data || {}, helpers);

        return this.env.render(templatePath, context);
    }
}


/**
 * 创建Nunjucks的env对象
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

module.exports = Render;