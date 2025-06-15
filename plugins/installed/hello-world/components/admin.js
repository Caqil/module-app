// Hello World Plugin - React Admin Component
// This is a proper React component function that your loader expects

function HelloWorldAdmin(props) {
  // Mock React if not available (your loader provides it)
  var React = props.React || (typeof require !== 'undefined' ? require('react') : null)
  
  if (!React) {
    // Fallback if React is not available
    return {
      type: 'div',
      props: {
        style: { padding: '20px' },
        children: 'Hello World Admin (React not available)'
      }
    }
  }

  var useState = React.useState
  var useEffect = React.useEffect
  
  // Component state
  var stateResult = useState(null)
  var apiResult = stateResult[0]
  var setApiResult = stateResult[1]
  
  var loadingResult = useState(false)
  var loading = loadingResult[0]
  var setLoading = loadingResult[1]
  
  // Test API function
  var testAPI = function() {
    setLoading(true)
    setApiResult(null)
    
    fetch('/api/plugin-routes/hello')
      .then(function(response) {
        return response.json()
      })
      .then(function(result) {
        setApiResult(result)
        setLoading(false)
      })
      .catch(function(error) {
        setApiResult({ success: false, error: error.message })
        setLoading(false)
      })
  }
  
  // JSX-like structure using React.createElement
  return React.createElement('div', {
    style: { 
      padding: '24px', 
      maxWidth: '800px',
      fontFamily: 'system-ui, sans-serif'
    }
  }, [
    // Header
    React.createElement('div', { 
      key: 'header',
      style: { marginBottom: '24px' }
    }, [
      React.createElement('h1', {
        key: 'title',
        style: { 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          color: '#1f2937'
        }
      }, 'Hello World Plugin'),
      React.createElement('p', {
        key: 'subtitle',
        style: { 
          color: '#6b7280', 
          marginBottom: '16px' 
        }
      }, 'React-compatible plugin admin interface')
    ]),
    
    // Status Card
    React.createElement('div', {
      key: 'status-card',
      style: {
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }
    }, [
      React.createElement('h2', {
        key: 'status-title',
        style: {
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#374151'
        }
      }, 'Plugin Status'),
      React.createElement('div', {
        key: 'status-grid',
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }
      }, [
        React.createElement('div', { key: 'status' }, [
          React.createElement('p', {
            key: 'status-label',
            style: { fontSize: '14px', color: '#6b7280', marginBottom: '4px' }
          }, 'Status'),
          React.createElement('p', {
            key: 'status-value',
            style: { fontSize: '16px', fontWeight: '500', color: '#059669' }
          }, '✅ Active & Running')
        ]),
        React.createElement('div', { key: 'version' }, [
          React.createElement('p', {
            key: 'version-label',
            style: { fontSize: '14px', color: '#6b7280', marginBottom: '4px' }
          }, 'Version'),
          React.createElement('p', {
            key: 'version-value',
            style: { fontSize: '16px', fontWeight: '500' }
          }, '1.0.0')
        ]),
        React.createElement('div', { key: 'id' }, [
          React.createElement('p', {
            key: 'id-label',
            style: { fontSize: '14px', color: '#6b7280', marginBottom: '4px' }
          }, 'Plugin ID'),
          React.createElement('p', {
            key: 'id-value',
            style: { 
              fontSize: '16px', 
              fontWeight: '500', 
              fontFamily: 'monospace', 
              color: '#4f46e5' 
            }
          }, 'hello-world')
        ])
      ])
    ]),
    
    // API Testing Card
    React.createElement('div', {
      key: 'api-card',
      style: {
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }
    }, [
      React.createElement('h2', {
        key: 'api-title',
        style: {
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '16px',
          color: '#374151'
        }
      }, 'API Testing'),
      React.createElement('p', {
        key: 'api-description',
        style: { color: '#6b7280', marginBottom: '16px' }
      }, 'Test the plugin\'s API endpoint to verify it\'s working correctly.'),
      React.createElement('button', {
        key: 'test-button',
        onClick: testAPI,
        disabled: loading,
        style: {
          background: loading ? '#9ca3af' : '#3b82f6',
          color: 'white',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: '500',
          marginBottom: '16px'
        }
      }, loading ? 'Testing...' : 'Test API'),
      
      // API Results
      apiResult ? React.createElement('div', {
        key: 'api-results',
        style: {
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '16px'
        }
      }, [
        React.createElement('p', {
          key: 'results-title',
          style: { fontWeight: '500', marginBottom: '8px' }
        }, 'API Response:'),
        React.createElement('pre', {
          key: 'results-content',
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap'
          }
        }, JSON.stringify(apiResult, null, 2))
      ]) : null
    ])
  ])
}

// Export as React component function (what your loader expects)
module.exports = HelloWorldAdmin