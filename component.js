const path = require('path');
const fs = require('fs');

const loadList = [
    'plugins',
    'middlewares',
    'services',
];

class Component {

    constructor(app) {

        this.app = app;
        this.settings = app.settings;
        this.componentsDir = path.join(this.settings.appDir, 'components');
        this.app.context.services = {};
    }

    load() {

        if (!fs.existsSync(this.componentsDir)) return;

        for(let name of loadList) {

            const components = this.locate(name);
            components.map((com) => {
                exports = require(path.join(this.componentsDir, name, com));
                this[name](com, exports);
            })
        }
    }

    locate(name) {

        const loadDir = path.join(this.componentsDir, name);
        var rst = [];
        
        if(!fs.existsSync(loadDir)) return [];

        for(let com of fs.readdirSync(loadDir)) {

            let stat = fs.statSync(path.join(loadDir, com));
            if(stat.isFile()) {
                // get the Component name
                rst.push(com.replace('.js', ''));
            }  
        }

        return rst;
    }

    plugins(name, exports) {

        exports(this.app);
    }

    services(name, exports) {

        this.app.context.services[name] = new exports(this.app);
    }

    middlewares(name, exports) {

        this.app.registerMiddleware(exports);
    }
}

module.exports = function (app) {

    new Component(app).load();
}