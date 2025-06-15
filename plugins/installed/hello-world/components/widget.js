// Hello World Plugin - React Widget Component
// This is a proper React component function

function HelloWorldWidget(props) {
  var React = props.React || (typeof require !== 'undefined' ? require('react') : null)
  
  if (!React) {
    return {
      type: 'div',
      props: {
        style: { padding: '16px' },
        children: 'Hello World Widget (React not available)'
      }
    }
  }

  var useState = React.useState
  var useEffect = React.useEffect
  
  // Component state
  var greetingState = useState('Hello, World!')
  var greeting = greetingState[0]
  var setGreeting = greetingState[1]
  
  var timeState = useState(new Date().toLocaleTimeString())
  var time = timeState[0]
  var setTime = timeState[1]
  
  var statusState = useState('🔄')
  var apiStatus = statusState[0]
  var setApiStatus = statusState[1]
  
  // Load greeting from API
  var loadGreeting = function() {
    fetch('/api/plugin-routes/hello')
      .then(function(response) {
        if (!response.ok) throw new Error('HTTP ' + response.status)
        return response.json()
      })
      .then(function(result) {
        if (result.success && result.message) {
          setGreeting(result.message)
          setApiStatus('✅')
        } else {
          throw new Error('Invalid response')
        }
      })
      .catch(function(error) {
        console.warn('Widget API error:', error)
        setGreeting('Hello, World! (API unavailable)')
        setApiStatus('❌')
      })
  }
  
  // Update time
  var updateTime = function() {
    setTime(new Date().toLocaleTimeString())
  }
  
  // Effects
  useEffect(function() {
    updateTime()
    loadGreeting()
    
    var timeInterval = setInterval(updateTime, 30000)
    var apiInterval = setInterval(loadGreeting, 120000)
    
    return function() {
      clearInterval(timeInterval)
      clearInterval(apiInterval)
    }
  }, [])
  
  // Render widget
  return React.createElement('div', {
    style: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      height: '100%',
      minHeight: '140px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      fontFamily: 'system-ui, sans-serif'
    }
  }, [
    // Header
    React.createElement('div', {
      key: 'header',
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        borderBottom: '1px solid #f3f4f6',
        paddingBottom: '8px'
      }
    }, [
      React.createElement('h3', {
        key: 'title',
        style: {
          margin: '0',
          fontSize: '16px',
          fontWeight: '600',
          color: '#374151'
        }
      }, 'Hello World'),
      React.createElement('div', {
        key: 'status-icons',
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }
      }, [
        React.createElement('span', {
          key: 'heart',
          style: { fontSize: '18px' }
        }, '❤️'),
        React.createElement('div', {
          key: 'status-dot',
          style: {
            width: '8px',
            height: '8px',
            background: '#10b981',
            borderRadius: '50%',
            marginLeft: '4px'
          },
          title: 'Plugin Active'
        })
      ])
    ]),
    
    // Content
    React.createElement('div', {
      key: 'content',
      style: { flex: '1' }
    }, [
      // Greeting
      React.createElement('div', {
        key: 'greeting',
        style: {
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '8px',
          lineHeight: '1.3'
        }
      }, greeting),
      
      // Time
      React.createElement('div', {
        key: 'time',
        style: {
          fontSize: '12px',
          color: '#6b7280',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }
      }, [
        React.createElement('span', { key: 'clock' }, '🕒'),
        React.createElement('span', { key: 'time-value' }, time)
      ]),
      
      // Stats
      React.createElement('div', {
        key: 'stats',
        style: {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          fontSize: '11px'
        }
      }, [
        React.createElement('div', {
          key: 'active-stat',
          style: {
            textAlign: 'center',
            padding: '6px',
            background: '#f9fafb',
            borderRadius: '4px'
          }
        }, [
          React.createElement('div', {
            key: 'active-label',
            style: { fontWeight: '600', color: '#374151' }
          }, 'Active'),
          React.createElement('div', {
            key: 'active-value',
            style: { color: '#10b981' }
          }, '✅')
        ]),
        React.createElement('div', {
          key: 'api-stat',
          style: {
            textAlign: 'center',
            padding: '6px',
            background: '#f9fafb',
            borderRadius: '4px'
          }
        }, [
          React.createElement('div', {
            key: 'api-label',
            style: { fontWeight: '600', color: '#374151' }
          }, 'API'),
          React.createElement('div', {
            key: 'api-value',
            style: { color: '#3b82f6' }
          }, apiStatus)
        ])
      ])
    ])
  ])
}

// Export as React component function
module.exports = HelloWorldWidget