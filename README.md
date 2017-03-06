# MySrv

Mysrv shorthand for "My Server", it's a MVC Framework for Node.js. Mysrv aims to make it more easily to build enterprise-grade Node.js web.


> This is alpha software; use at your own risk


## Installation
```
npm install mysrv
```



## Project structure
```
--assets/
	-css/
	-js/
	-favicon.ico
--components/
	-contollers/
	-middlewares/
	-models/
	-plugins/
	-services/
--tasks/
--config/
--views/
--app.js
```



## Example

Controller

```
class IndexController {

    /**
     * default welcome page
     * 默认首页
     */
    index() {

        this.render({title: 'Hello'}); //渲染模版，第一个参数传递的数据，可以在模版直接使用
    }

    /**
     * convenient action annotation
     * 方便的action注解指令
     * 下面action映射的URL为 '/user/login'，并且只允许POST请求
     */
    login($method = 'POST', $url='/user/login') {

        this.render(null, {layout: 'login'}); //使用名称为 "login" 的布局文件
    }
}

module.exports = IndexController;
```