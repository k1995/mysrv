const util = require('util');
const nunjucks = require('nunjucks');

var stack = {
    css: [],
    js: []
};

const patten = {
    css: '<link href="%s" rel="stylesheet" type="text/css" />',
    js: '<script src="%s"></script>'
};

exports.js = function (url, order = 1) {

    push('js', url, order);
}

exports.css = function (url, order = 1) {

    push('css', url, order);
}

exports.cssTag = function () {

    return echo('css');
}

exports.jsTag = function () {

    return echo('js');
}

/**
 * register asset
 * @param {string} type 
 * @param {string} url 
 */
function push(type, url, order) {

    stack[type].push({
        order: order,
        url: url
    });
}

function echo(type) {

    var output = '';

    stack[type].sort((a, b) => {

        return a.order - b.order;
    });

    for(let i of stack[type]) {

        output += util.format(patten[type], i.url);
    }

    stack[type] = [];

    return new nunjucks.runtime.SafeString(output);
}