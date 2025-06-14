import os

def create_file(path, content=""):
    """Create a file with optional content"""
    with open(path, 'w') as f:
        f.write(content)

def create_oauth_plugin_structure():
    # Define the base directory
    base_dir = "oauth-plugin"
    os.makedirs(base_dir, exist_ok=True)

    # Create root files
    create_file(os.path.join(base_dir, "plugin.json"), "// Plugin manifest")
    create_file(os.path.join(base_dir, "index.js"), "// Main plugin entry point")
    create_file(os.path.join(base_dir, "README.md"), "# OAuth Plugin\n\nPlugin documentation")

    # Create routes directory and files
    routes_dir = os.path.join(base_dir, "routes")
    os.makedirs(routes_dir, exist_ok=True)
    create_file(os.path.join(routes_dir, "callback.js"), "// OAuth callback handler")
    create_file(os.path.join(routes_dir, "providers.js"), "// Get available providers")
    create_file(os.path.join(routes_dir, "config.js"), "// Plugin configuration API")

    # Create admin directory and files
    admin_dir = os.path.join(base_dir, "admin")
    os.makedirs(admin_dir, exist_ok=True)
    create_file(os.path.join(admin_dir, "oauth-settings.jsx"), "// Admin configuration page")

    # Create widgets directory and files
    widgets_dir = os.path.join(base_dir, "widgets")
    os.makedirs(widgets_dir, exist_ok=True)
    create_file(os.path.join(widgets_dir, "oauth-stats.jsx"), "// Dashboard statistics widget")

    # Create components directory and files
    components_dir = os.path.join(base_dir, "components")
    os.makedirs(components_dir, exist_ok=True)
    create_file(os.path.join(components_dir, "OAuthButtons.jsx"), "// OAuth login buttons")

    # Create lib directory and files
    lib_dir = os.path.join(base_dir, "lib")
    os.makedirs(lib_dir, exist_ok=True)
    create_file(os.path.join(lib_dir, "oauth-providers.js"), "// OAuth provider configurations")
    create_file(os.path.join(lib_dir, "oauth-utils.js"), "// OAuth utility functions")
    create_file(os.path.join(lib_dir, "database.js"), "// Database models and operations")

    # Create assets directory and files
    assets_dir = os.path.join(base_dir, "assets")
    os.makedirs(assets_dir, exist_ok=True)
    create_file(os.path.join(assets_dir, "oauth.css"), "/* OAuth button styles */")
    create_file(os.path.join(assets_dir, "oauth.js"), "// Client-side OAuth handling")

if __name__ == "__main__":
    create_oauth_plugin_structure()
    print("OAuth plugin folder structure created successfully!")