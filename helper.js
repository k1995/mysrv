/**
 * 模版中嵌套渲染
 */
function render(app, name) {

    var tmp = name.split('/');
    var action, controller;

    if (tmp.length > 1) {

        action = tmp[1];
        controller = tmp[0];
    } else {
        action = name;
        controller = app.routeInfo.controller;
    }

    // 执行action
    app.controllers[controller][action]();

    //返回渲染后的HTML
}

function is_mobile() {

    return true;
}