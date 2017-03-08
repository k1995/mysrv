/**
 * 此模块中导出的方法，用于在视图模版中调用
 */
var app;

exports.startup = function (_app) {

    app = _app;
}


/**
 * 渲染子模块，执行对应的action
 */
exports.render = function(ctx, url, data, callback) {

    if(!callback) callback = data;

    var tmp = url.split(':'), controller, action;

    if (tmp.length > 1) {

        controller = tmp[0];
        action = tmp[1];
    } else {
        controller = tmp[0];
        action = 'index';
    }

    var func;

    if(typeof app.controllers[controller] == 'function') {

        func = app.controllers[controller].prototype[action];
    }else{
        func = app.controllers[controller][action];
    }
    
    Promise.resolve(func.call(ctx)).then(function() {

        data = Object.assign(data || {}, ctx.renderInfo.data || {});
        app.render(ctx, `${controller}/${action}`, data).then((content) => {
            callback(null, app.safeString(content));
        });
    });
}