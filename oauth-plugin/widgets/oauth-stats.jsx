import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, TrendingUp, Shield, AlertCircle } from 'lucide-react'

const OAuthDashboardWidget = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      // This would be implemented in the plugin's database operations
      // For now, we'll simulate the data
      setTimeout(() => {
        setStats({
          totalOAuthUsers: 142,
          oauthLoginsToday: 28,
          popularProvider: 'Google',
          conversionRate: 78.5,
          providerStats: {
            google: { users: 89, enabled: true },
            github: { users: 31, enabled: true },
            facebook: { users: 18, enabled: false },
            linkedin: { users: 4, enabled: true }
          }
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to fetch OAuth stats:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>OAuth Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>OAuth Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <span>Unable to load statistics</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>OAuth Statistics</span>
        </CardTitle>
        <CardDescription>Social login performance metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">OAuth Users</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">{stats.totalOAuthUsers}</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Today</span>
            </div>
            <div className="text-2xl font-bold text-green-700">{stats.oauthLoginsToday}</div>
          </div>
        </div>

        {/* Popular Provider */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm font-medium text-gray-600">Most Popular</div>
            <div className="text-lg font-semibold">{stats.popularProvider}</div>
          </div>
          <Badge variant="secondary">{stats.conversionRate}% conversion</Badge>
        </div>

        {/* Provider Breakdown */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-600">Provider Distribution</div>
          {Object.entries(stats.providerStats).map(([provider, data]) => (
            <div key={provider} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${data.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm capitalize">{provider}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{data.users}</span>
                {!data.enabled && (
                  <Badge variant="outline" className="text-xs">Disabled</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default OAuthDashboardWidget
