/**
 * 此模块中导出的方法，用于在视图模版中调用
 */
var app;
const co = require('co');

exports.startup = function (_app) {

    app = _app;
}


/**
 * 渲染子模块，执行对应的action
 */
exports.render = function(url, data) {

    var tmp = url.split(':');
    var controller, action;

    if (tmp.length > 1) {

        controller = tmp[0];
        action = tmp[1];
    } else {
        controller = tmp[0];
        action = 'index';
    }

    var gen;

    if(typeof app.controllers[controller] == 'function') {

        gen = app.controllers[controller].prototype[action].call(this);
    }else{
        gen = app.controllers[controller][action].call(this);
    }

    let rst = gen.next();

    if (!rst.done) {

        co(new ProxyGenerator(gen, rst));
    }

    return app.render.safeString(app.render.renderTmplate(this, `${controller}/${action}`, data));
}

class ProxyGenerator {
    constructor(gen, ret) {
        this.gen = gen;
        this.ret = ret;
        this.first = true;
    }

    next(value) {
        if (this.first) {
            this.first = false;
            return this.ret;
        }
        return this.gen.next(value);
    }
}