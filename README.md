#### 实现一个带有热更新的最小打包工具

##### 打包工具原理

入口文件 -> 遍历所有路径 -> 依赖图 -> 编译（babel） -> 打包 -> 输出 -> 页面请求 -> 吐对应的 chunk 过去 -> 渲染 -> 代码变更 -> 通知 -> reload -> 渲染


##### HMR原理

入口 -> 转换 -> 输出 -> 页面请求 -> 吐对应的 chunk 过去 -> 渲染 -> 代码变更 -> 通知 -> reload -> 渲染
