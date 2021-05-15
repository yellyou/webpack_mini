const p = require('path')

const wsTpl = `
  <script type='text/javascript'>
  var ws = new WebSocket('ws://localhost:8001');
  ws.onmessage = function (e) {
    window.location.reload()
  }
  </script >
`

function getBaseTpl(isWs = true) {
  return `
  <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>分享</title>
      <meta name="viewport" content="width=device-width,initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
      <link rel="icon" href="data:image/ico;base64,aWNv">
      ${getBeforeInjection()}
      %%%script_link%%%
    </head>
    <body>
      <div id='root'></div>
    </body>
      ${ isWs ? wsTpl : ''}
  </html>
  `
}

function getBuildTpl (imports, external) {
  if (!external || !Object.keys(external).length) {
    return getBaseTpl(false)
  }

  const dlist = getDepencies(imports.depend, external)
  const locals = getLocals(imports.local.map(e => p.join('..', e)))

  const text = [].concat(dlist, locals).join('\n')
  return getBaseTpl(false).replace('%%%script_link%%%', text)
}

function getDevTpl(imports, external) {
  if (!external || Object.keys(external).length == 0) {
    return getBaseTpl()
  }else {
    const dependList = getDepencies(imports.depend, external)
    const localList = getLocals(imports.local)
    const text = [].concat(dependList,localList).join('\n')
    return getBaseTpl().replace('%%%script_link%%%', text)
  }
}

function getBeforeInjection () {
  return [
    '<script src="https://cdn.bootcdn.net/ajax/libs/babel-standalone/6.25.0/babel.min.js"></script>',
    '<script crossorigin src="https://cdn.bootcdn.net/ajax/libs/react/16.14.0/umd/react.production.min.js"></script>',
    '<script crossorigin src="https://cdn.bootcdn.net/ajax/libs/react-dom/16.14.0/umd/react-dom.production.min.js"></script>'
  ].join('\n')
}

function getLocals(locals) {
  return locals.reverse().map(e => {
    const ext = (p.extname(e) || '').slice(1)
    return createLinkOrScript(ext, e, false)
  })
}

function getDepencies(depends, external) {
  let list = []
  depends.forEach(d => {
    const item = external[d]
    
    // 只处理 object 的情况，比如 external: { antd: { js: 'xxxx', css: 'xxxxx' } }
    if (item && typeof item === 'object') {
      for (const [key, value] of Object.entries(item)) {
        list.push(
          createLinkOrScript(key, value, key === 'js')
        )
      }
    }
  })

  return list.filter(Boolean)
}

function createLinkOrScript (type, src, depend) {
  if (type === 'js') {
    return `<script type=${depend ? 'text/javascript' : 'text/babel'} src='${src}'></script>`
  }
  if (type === 'css') {
    return `<link rel='stylesheet' type="text/css" href="${src}"></link>`
  }
  return ''
}

module.exports = {
  getBaseTpl,
  getBuildTpl,
  getDevTpl
}
