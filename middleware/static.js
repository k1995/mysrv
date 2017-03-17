const path = require('path');
const fs = require('fs');
const send = require('koa-send');

var settings, files = [];

/**
 * 处理静态资源
 */
exports = module.exports = async function (ctx, next) {

    for (let file of files) {

        var maybe = ctx.path.replace('/', '');
        var tmp = maybe.split('/');

        // 判断文件夹或文件
        if (tmp[0] == file) {

            await send(ctx, ctx.path, settings);
            return;
        }
    }

    await next();
}

exports.startup = function (app) {

    settings = app.settings.asset ? app.settings.asset : {};
    if (!settings.root) settings.root = path.join(app.settings.appDir, 'assets');
    if (!fs.existsSync(settings.root)) return;
    files = fs.readdirSync(settings.root);
}

exports.level = 10;