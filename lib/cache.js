class Cache {
  constructor() {
    this.cache = {}
    this.depent = {}
  }

  addCache(path, ctx) {
    this.cache[path] = ctx
  }

  getCache(path) {
    return this.cache[path]
  }

  addDepent(path, depend) {
    this.depent[path] = depend
  }

  getDepent(path) {
    return this.depent[path]
  }
}

module.exports = new Cache()