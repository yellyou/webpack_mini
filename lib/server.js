const express = require('express')
const open = require('open')
const app = express()
const fs = require('fs')
const tool = require('./core')
const p = require('path')
const template = require('./tpl')
const mime = require('mime-types')
const etag = require('etag')
const cache = require('./cache')
const chokidar = require('chokidar')
const WebSocketServer = require('ws').Server

// 最简单版本的热更新
class Server {
  constructor(config) {
    this.config = config
    this.wss = new WebSocketServer({ port: 8001 });
    this.wss.on('connection', (wss) => {
      const watch = chokidar.watch('src', {
        persistent: true,
        ignoreInitial: true,
        disableGlobbing: false
      })

      // 告诉前端文件变更了
      watch.on('change', (filePath) => {
        wss.send('reload')
      })
    })
  }

  start() {
    const { port = 3000 } = this.config
    app.listen(port, () => console.log(`服务已启动 端口号:${port}!`))
    app.all('*',this._serverCallBack)
    open(`http://127.0.0.1:${port}`)
  }

  sendHTML(html, res) {
    const ETag = etag(html);
    const headers = {
      'Content-Type': mime.contentType('js') || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      ETag,
      Vary: 'Accept-Encoding'
    };
    res.writeHead(200, headers);
    res.write(html, 'utf-8');
    res.end()
  }

  _serverCallBack = (req, res) => {
    const { input = 'src/pages', external = {}} = this.config
    try {
      // 如果不是文件 而是路径的话 则直接加载路径
      if (!~req.url.indexOf('.')) {
        const path = p.join(tool.getFilePath(input, req.url))
        if (fs.existsSync(path)) {
          const imports = tool.generateDepencies(path, true)
          imports.local.unshift(path)
          const html = template.getDevTpl(imports, external)
          return res.send(html)
        }else {
          throw new Error('未找到指定文件路径:' + path)
        }
      } else if (req.url !== '/favicon.ico') {
        return this.sendHTML(cache.getCache(req.url.slice(1)), res)
      } else {
        return this.sendHTML('', res)
      }
    } catch (error) {
      const html = template.getBaseTpl().replace('%%%script_link%%%', '')
      return res.send(html)
    }
  }
}
module.exports = Server
