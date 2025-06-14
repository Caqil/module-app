import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Check, Save, Eye, EyeOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const OAuthAdminPage = () => {
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [showSecrets, setShowSecrets] = useState({})

  const providers = [
    {
      id: 'google',
      name: 'Google',
      icon: '🔍',
      description: 'Enable Google OAuth authentication',
      fields: [
        { key: 'clientId', label: 'Client ID', type: 'text', required: true },
        { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true }
      ],
      setupUrl: 'https://console.developers.google.com/'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: '💻',
      description: 'Enable GitHub OAuth authentication',
      fields: [
        { key: 'clientId', label: 'Client ID', type: 'text', required: true },
        { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true }
      ],
      setupUrl: 'https://github.com/settings/applications/new'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      description: 'Enable Facebook OAuth authentication',
      fields: [
        { key: 'appId', label: 'App ID', type: 'text', required: true },
        { key: 'appSecret', label: 'App Secret', type: 'password', required: true }
      ],
      setupUrl: 'https://developers.facebook.com/'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '💼',
      description: 'Enable LinkedIn OAuth authentication',
      fields: [
        { key: 'clientId', label: 'Client ID', type: 'text', required: true },
        { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true }
      ],
      setupUrl: 'https://www.linkedin.com/developers/'
    }
  ]

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/plugin-routes/oauth/config', {
        credentials: 'include'
      })
      const result = await response.json()
      
      if (result.success) {
        setConfig(result.data)
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load configuration' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/plugin-routes/oauth/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ config })
      })

      const result = await response.json()
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Configuration saved successfully' })
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save configuration' })
    } finally {
      setSaving(false)
    }
  }

  const updateProviderConfig = (providerId, field, value) => {
    setConfig(prev => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        [field]: value
      }
    }))
  }

  const toggleSecretVisibility = (providerId, field) => {
    setShowSecrets(prev => ({
      ...prev,
      [`${providerId}-${field}`]: !prev[`${providerId}-${field}`]
    }))
  }

  const getCallbackUrl = (providerId) => {
    return `${window.location.origin}/api/plugin-routes/oauth/callback/${providerId}`
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">OAuth Providers</h1>
        <p className="text-gray-600 mt-1">
          Configure OAuth authentication providers for social login
        </p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
          {message.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <Check className="h-4 w-4 text-green-500" />
          )}
          <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="settings">General Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          {providers.map(provider => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{provider.icon}</span>
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{provider.name}</span>
                        {config[provider.id]?.enabled && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Enabled
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={config[provider.id]?.enabled || false}
                    onCheckedChange={(checked) =>
                      updateProviderConfig(provider.id, 'enabled', checked)
                    }
                  />
                </div>
              </CardHeader>

              {config[provider.id]?.enabled && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {provider.fields.map(field => (
                      <div key={field.key} className="space-y-2">
                        <Label htmlFor={`${provider.id}-${field.key}`}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <div className="relative">
                          <Input
                            id={`${provider.id}-${field.key}`}
                            type={field.type === 'password' && !showSecrets[`${provider.id}-${field.key}`] ? 'password' : 'text'}
                            value={config[provider.id]?.[field.key] || ''}
                            onChange={(e) =>
                              updateProviderConfig(provider.id, field.key, e.target.value)
                            }
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                          {field.type === 'password' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                              onClick={() => toggleSecretVisibility(provider.id, field.key)}
                            >
                              {showSecrets[`${provider.id}-${field.key}`] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium">Callback URL</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Use this URL in your {provider.name} OAuth application:
                    </p>
                    <code className="block mt-2 p-2 bg-white rounded border text-sm">
                      {getCallbackUrl(provider.id)}
                    </code>
                    <Button
                      variant="link"
                      className="mt-2 p-0 h-auto"
                      onClick={() => window.open(provider.setupUrl, '_blank')}
                    >
                      Configure at {provider.name} →
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general OAuth behavior and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-create Users</Label>
                  <p className="text-sm text-gray-600">
                    Automatically create user accounts for new OAuth logins
                  </p>
                </div>
                <Switch
                  checked={config.autoCreateUsers || false}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, autoCreateUsers: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultRole">Default Role</Label>
                <select
                  id="defaultRole"
                  className="w-full p-2 border rounded-md"
                  value={config.defaultRole || 'user'}
                  onChange={(e) =>
                    setConfig(prev => ({ ...prev, defaultRole: e.target.value }))
                  }
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                </select>
                <p className="text-sm text-gray-600">
                  Default role assigned to new users created via OAuth
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedDomains">Allowed Email Domains</Label>
                <Input
                  id="allowedDomains"
                  placeholder="example.com, company.com (optional)"
                  value={config.allowedDomains?.join(', ') || ''}
                  onChange={(e) => {
                    const domains = e.target.value
                      .split(',')
                      .map(d => d.trim())
                      .filter(d => d.length > 0)
                    setConfig(prev => ({ ...prev, allowedDomains: domains }))
                  }}
                />
                <p className="text-sm text-gray-600">
                  Restrict OAuth registration to specific email domains (leave empty to allow all)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  )
}

export default OAuthAdminPage