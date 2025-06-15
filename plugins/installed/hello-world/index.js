// Hello World Plugin - Main Entry (CommonJS)
function HelloWorldPlugin(api) {
  this.api = api
  this.initialized = false
  this.config = {
    message: 'Hello, World!',
    showTimestamp: true
  }
}

HelloWorldPlugin.prototype.initialize = function() {
  if (this.initialized) return Promise.resolve()

  console.log('🚀 Initializing Hello World Plugin...')
  
  var self = this
  return Promise.resolve().then(function() {
    try {
      return self.api.getPluginConfig('hello-world')
    } catch (error) {
      return {}
    }
  }).then(function(savedConfig) {
    self.config = Object.assign({}, self.config, savedConfig)
    self.initialized = true
    console.log('✅ Hello World Plugin initialized successfully')
  }).catch(function(error) {
    console.log('Using default configuration')
    self.initialized = true
  })
}

HelloWorldPlugin.prototype.getGreeting = function() {
  var message = this.config.message || 'Hello, World!'
  var timestamp = this.config.showTimestamp ? ' (' + new Date().toLocaleString() + ')' : ''
  return message + timestamp
}

HelloWorldPlugin.prototype.updateConfig = function(newConfig) {
  this.config = Object.assign({}, this.config, newConfig)
  return { success: true }
}

HelloWorldPlugin.prototype.getConfig = function() {
  return this.config
}

HelloWorldPlugin.prototype.cleanup = function() {
  this.initialized = false
}

// CommonJS export
module.exports = HelloWorldPlugin