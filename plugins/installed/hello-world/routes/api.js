// Hello World Plugin - API Handler (CommonJS)
function handleRequest(request, context) {
  return new Promise(function(resolve) {
    try {
      var method = request.method
      
      if (method === 'GET') {
        var message = 'Hello from Hello World Plugin API!'
        
        if (context && context.plugin) {
          try {
            if (typeof context.plugin.getGreeting === 'function') {
              message = context.plugin.getGreeting()
            }
          } catch (error) {
            console.log('Could not get greeting from plugin instance:', error)
          }
        }
        
        var responseData = {
          success: true,
          message: message,
          timestamp: new Date().toISOString(),
          plugin: 'hello-world',
          version: '1.0.0',
          method: method,
          path: '/hello'
        }
        
        resolve(new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'X-Plugin': 'hello-world'
          }
        }))
        return
      }
      
      // Method not allowed
      resolve(new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed',
        allowedMethods: ['GET']
      }), {
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          'Allow': 'GET'
        }
      }))
      
    } catch (error) {
      console.error('API handler error:', error)
      resolve(new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }))
    }
  })
}

// Export for your system
module.exports = handleRequest
module.exports.default = handleRequest
module.exports.handleRequest = handleRequest
module.exports.GET = handleRequest