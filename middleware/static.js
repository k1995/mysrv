const path = require('path');
const fs = require('fs');
const send = require('koa-send');

var assetsRoot, files;

/**
 * 处理静态资源
 */
exports = module.exports = async function (ctx, next) {

    for (let file of files) {

        var maybe = ctx.path.replace('/', '');
        var tmp = maybe.split('/');
        
        // 判断文件夹或文件
        if(tmp[0] == file) {

            await send(ctx, ctx.path, { root: assetsRoot });
            return;
        }
    }

    await next();
}

exports.startup = function(app) {

    const appDir = app.settings.appDir;
    assetsRoot = path.join(appDir, 'assets');
    files = fs.readdirSync(assetsRoot);
}

exports.level = 10;