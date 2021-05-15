const cfg = require('../config')
const serverControl = require('./server')
const server = new serverControl(cfg)
server.start()
