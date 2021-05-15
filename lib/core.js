
const child = require('child_process')
const fs = require('fs')
const p = require('path')

const babel = require('@babel/core')
const types = require('@babel/types')
const traverse = require('@babel/traverse').default

const cache = require('./cache')
const tpl = require('./tpl')

// 解析所有的 import 构建依赖图
function generateDepencies (filePath, isRoot = false) {
  
  const imports = {
    depend: [],
    local: []
  }

  // 拿到文件内容字符串
  const context = fs.readFileSync(filePath, 'utf-8')

  // 将文件内容转成AST语法树
  const transform = babel.transform(context)
  const ast = babel.parseSync(transform.code)


  const _template = babel.template(`window.%%name%% = %%name%%`)
  const _render = babel.template(`ReactDOM.render(React.createElement(%%name%%,{},{}), document.getElementById('root'))`)

  // DFS
  traverse(ast, {

    // 处理 import
    ImportDeclaration(path) {
      // import React from 'react'
      const { source, specifiers } = path.node
      const { value } = source // react
      const names = specifiers.map(e => e.local.name)
      //判断引入的依赖是否是本地文件
      if (!~value.indexOf('.')) {
        imports.depend.push(value)
        const isFuckDefault = specifiers.some(e => e.type === 'ImportDefaultSpecifier')
        if (isFuckDefault) {
          path.remove()
        }
        else {
          path.replaceWith(babel.template(`const { %%define%% } = %%name%%`.replace('%%name%%', value).replace('%%define%%', names.join(', ')))())
        }
      }
      else {
        // 本地引入的
        const localFilePath = getExtFilePath(p.join(filePath, '..', value))
        imports.local.push(localFilePath)
        if (p.extname(localFilePath) === '.js') {
          // 递归，这样所有的文件都被处理了
          const ret = generateDepencies(localFilePath, isRoot)
          imports.depend = imports.depend.concat(ret.depend)
          imports.local = imports.local.concat(ret.local)

          path.remove()
        }
        else {
          cache.addCache(localFilePath, fs.readFileSync(localFilePath, 'utf-8'))
          path.remove()
        }
      }
    },

    // 导出 export default  方式的
    ExportDefaultDeclaration(path) {
      const { declaration } = path.node
      const { id } = declaration
      const { name } = id // 只处理具名的导出

      path.replaceWith(declaration)
      if (isRoot) {
        path.parent.body.push(_template({ name: types.identifier(name) }))
        path.parent.body.push(_render({ name: types.identifier(name) }))
      }
      else {
        path.parent.body.push(_template({ name: types.identifier(name) }))
      }
    }
  })

  const txt = babel.transformFromAstSync(ast, transform.code)

  // 缓存一下，为了更快、更高、更强
  cache.addCache(filePath, txt.code)
  cache.addDepent(filePath, imports)
  return imports
}

function travel (config) {

  const { input, output = 'dist', external } = config

  if (fs.existsSync(output)) {
    // 先清空原来的 output
    child.execSync('rm -rf ' + output)
  }

  // 然后建一个
  if (!fs.existsSync(output)) {
    fs.mkdirSync(output)
    fs.mkdirSync(output + '/static')
  }

  // 读取入口文件
  fs.readdirSync(input).forEach(file => {
    const filePath = p.join(input, file, 'index.js')
    const imports = generateDepencies(filePath, true)

    // 本地文件写到打包的路径下去
    imports.local.unshift(filePath)
    imports.local.forEach(f => {
      const target = p.join(process.cwd(), output)
      const destination = p.join(target, f)
      mkdir(target, f)
      // console.log('------------', destination, cache.getCache(f))
      fs.writeFileSync(destination, cache.getCache(f), 'utf-8')
    })

    const html = tpl.getBuildTpl(imports, external)
    const _path = p.join(output, 'static')
    if (!fs.existsSync(_path)) {
      fs.mkdirSync(_path)
    }
    fs.writeFileSync(p.join(_path, 'index.html'), html, 'utf-8')
  })
}

function getExtFilePath (path) {
  const ext = p.extname(path)
  if (ext === '') {
    const a = p.join(path) + '.js'
    const b = p.join(p.join(path), 'index.js')
    const r = [a, b].find(i => fs.existsSync(i))
    return r || path
  }
  return path
}

function mkdir(target,dir) {
  const dirs = dir.split('/').filter((e)=>e.indexOf('.') == -1)
  dirs.forEach((e,i)=>{
    let dirPath = p.join(target,dirs.slice(0, i + 1).join('/'))
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath)
    }
  })
}

function getFileName(path) {
  switch (path) {
    case '/':
      return 'Index'
    default:
      return path.slice(0, 1).toUpperCase() + path.slice(1)
  }
}

function getFilePath(path,url) {
  const filePath = p.join(path,getFileName(url))
  const react = p.join(filePath, 'index.js')
  const vue = p.join(filePath, 'index.vue')
  if (fs.existsSync(react)) {
    return react
  }else {
    return vue
  }
}

module.exports = {
  travel,
  generateDepencies,
  getFileName,
  getFilePath
}
