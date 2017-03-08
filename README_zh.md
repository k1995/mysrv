# MySrv

Mysrv 是 "My Server" 的缩写，是一款基于Koa2的Node.js MVC框架。


  > 该框架尚在测试开发中， 请慎用

## 功能特色
* 支持 `Express` 式 URL 路由

* 模块化开发
  将一个页面拆分为多个子模块，加载子模块时会执行完整的action，不是仅仅是`include`模版

* 默认使用 `Nunjucks` 作为模版引擎

* 基于Koa2，使用 `async/await` 写出同步代码，拒绝地狱式回调

* 易扩展

  支持自定义中间件(middleware)，插件


## 安装
```
npm install mysrv
```



## 项目结构
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



## 示例

__Controller__

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
    async login($method = 'POST', $url='/user/login') {
    	
    	//使用async/await 拒绝地狱式回调
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
      
      // 不渲染模版。直接输出Json数据
      this.json({
      	data: 'Hello Mysrv'
      });
    }
}

module.exports = IndexController;
```

__视图__ 

在`action`中调用 `this.render()` 开始模版渲染流程。如果在模版中调用 `$.render()` 会渲染子模版，并返回渲染后的HTML。注意`$.render()`不仅仅只是将其渲染后的HTML包含进来，它会执行完整的 action !

view.html

```html
<div>
	{{ ctx | $.render('index:child') }}
</div>
```



上面完成了`view.html`模版的渲染后，还不能直接返回给浏览器，他不是完整的HTML。下面还要渲染 `Layout` 布局模版，`{{ content }}` 会替换为上面的 `view.html`渲染后的内容，这样 `view.html` 和 `layout.html`拼接起来才是一个完整的HTML 页面。 

layout.html

```html
<head>
    <title>{{ title }}</title>
    ...
</head>
<body>
    {{ ctx | $.render('layout:header') }}

    <div class="container">
    
        {{ content }}
    
    </div>
    
    {{ ctx | $.render('layout:footer') }}
</body>
</html>
```

> __布局模版__ 顾名思义，即定义一个HTML的基本结构。如一个网站的头部、尾部每个页面基本相同，只是中间内容在发生变化，这些公用的部分就应该放在__布局模版__中，以减少重复代码，主模版就只是中间变化的这部分内容。
>
> 布局模版默认是开启的，如果你的主模版(如上面的view.html)已经包含完整的HTML，不想拼接布局模版，通过设置`this.render` 第二个参数 `layout = null` 来关闭布局模式。即 `this.render(data, {layout: null})`。

