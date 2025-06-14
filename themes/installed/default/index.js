class DefaultTheme {
  constructor(context) {
    this.context = context
    this.config = context.config
    this.customization = context.customization
  }

  // Initialize theme
  async initialize() {
    console.log('Default theme initialized')
    
    // Apply custom CSS variables
    this.applyCSSVariables()
    
    // Register theme components
    this.registerComponents()
    
    // Setup theme hooks
    this.setupHooks()
  }

  // Apply CSS custom properties based on customization
  applyCSSVariables() {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      const colors = this.customization.colors || {}
      
      Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(`--theme-${key}`, value)
      })
      
      // Apply border radius
      if (this.customization.borderRadius) {
        root.style.setProperty('--theme-border-radius', this.customization.borderRadius)
      }
    }
  }

  // Register theme components
  registerComponents() {
    const { api } = this.context
    
    // Register layouts
    api.setLayout('default', 'layouts/default.tsx')
    api.setLayout('admin', 'layouts/admin.tsx')
    api.setLayout('auth', 'layouts/auth.tsx')
    
    // Register pages
    api.addPage({
      path: '/',
      component: 'pages/home.tsx',
      layout: 'default',
      title: 'Home'
    })
    
    api.addPage({
      path: '/about',
      component: 'pages/about.tsx',
      layout: 'default',
      title: 'About'
    })
    
    api.addPage({
      path: '/contact',
      component: 'pages/contact.tsx',
      layout: 'default',
      title: 'Contact'
    })
    
    // Register components
    api.addComponent({
      name: 'Header',
      component: 'components/header.tsx'
    })
    
    api.addComponent({
      name: 'Footer',
      component: 'components/footer.tsx'
    })
    
    api.addComponent({
      name: 'Hero',
      component: 'components/hero.tsx'
    })
    
    api.addComponent({
      name: 'FeatureGrid',
      component: 'components/feature-grid.tsx'
    })
  }

  // Setup theme hooks
  setupHooks() {
    // Hook into customization changes
    this.context.events.on('customization:changed', (data) => {
      this.customization = { ...this.customization, ...data }
      this.applyCSSVariables()
    })
    
    // Hook into theme activation
    this.context.events.on('theme:activated', () => {
      console.log('Default theme activated')
    })
    
    // Hook into theme deactivation
    this.context.events.on('theme:deactivated', () => {
      console.log('Default theme deactivated')
    })
  }

  // Cleanup when theme is deactivated
  cleanup() {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      const colors = this.customization.colors || {}
      
      // Remove CSS custom properties
      Object.keys(colors).forEach(key => {
        root.style.removeProperty(`--theme-${key}`)
      })
      
      root.style.removeProperty('--theme-border-radius')
    }
  }
}

module.exports = DefaultTheme