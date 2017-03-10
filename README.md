# MySrv

Mysrv shorthand for "My Server", it's a MVC Framework for Node.js. Mysrv aims to make it more easily to build enterprise-grade Node.js web.


> This is alpha software; use at your own risk

[【中文介绍】](README_zh.md)

## Feature

* Modular programming  

  Cutting up pages into pieces of modules, each module has a corresponding `action`, not just `inculde ` template

* Routing  

  supprot Express-style routing

* Render  

  Using mozilla's `Nunjucks` as the default template engine

* Flexible  

  support custom `koa middleware` & plugins


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

__Controller__

```
class IndexController {

    /**
     * default welcome page
     * Index as the default action
     */
    index() {

        this.render({title: 'Hello'}); //渲染模版，第一个参数传递的数据，可以在模版直接使用
    }

    /**
     * convenient action annotation
     * 方便的action注解指令
     * 下面action映射的URL为 '/user/login'，并且只允许POST请求
     */
    async login($method = 'POST', $url='/user/login') {
    	
    	// using async/await
    	const resultModel = await this.userService(this.params.userName, this.params.pass);
       	
       	if(resultModel.success) {
          ...
       	}else{
          ...
       	}
       	
       	this.render(null, {layout: 'login'}); //使用名称为 "login" 的布局文件
    }
    
    /**
    * Output JSON
    */
    api() {
    
      this.json({
      	data: 'Hello Mysrv'
      });
    }
}

module.exports = IndexController;
```

__Render view__

在`action`中调用 `this.render()` 开始模版渲染流程。如果在模版中调用 `{% render "index:child %}` 会渲染子模版，并返回渲染后的HTML。注意`{% render "index:child %}`不仅仅只是将其渲染后的HTML包含进来，它会执行完整的 action !

view.html

```html
<div>
	{% render "index:child %}
</div>
```



上面完成了`view.html`模版的渲染后，还不能直接返回给浏览器，他不是完整的HTML。下面还要渲染 `Layout` 布局模版，`{{ view}}` 会替换为上面的 `view.html`渲染后的内容，这样 `view.html` 和 `layout.html`拼接起来才是一个完整的HTML 页面。 

layout.html

```html
<head>
    <title>{{ title }}</title>
    ...
</head>
<body>
    {% render "layout:header" %}

    <div class="container">
    
        {{ view }}
    
    </div>
    
    {% render "layout:footer" %}
</body>
</html>
```

> __布局模版__ 顾名思义，即定义一个HTML的基本结构。如一个网站的头部、尾部每个页面基本相同，只是中间内容在发生变化，这些公用的部分就应该放在__布局模版__中，以减少重复代码，主模版就只是中间变化的这部分内容。
>
> 布局模版默认是开启的，如果你的主模版(如上面的view.html)已经包含完整的HTML，不想拼接布局模版，通过设置`this.render` 第二个参数 `layout = null` 来关闭布局模式。即 `this.render(data, {layout: null})`。

