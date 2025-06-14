import os

def create_file(path, content=""):
    """Create a file with optional content"""
    with open(path, 'w') as f:
        f.write(content)

def create_default_theme_structure():
    # Define the base directory
    base_dir = os.path.join("themes", "installed", "default")
    os.makedirs(base_dir, exist_ok=True)

    # Create root files
    create_file(os.path.join(base_dir, "theme.json"), "// Theme manifest")
    create_file(os.path.join(base_dir, "index.js"), "// Theme entry point")
    create_file(os.path.join(base_dir, "README.md"), "# Default Theme\n\nTheme documentation")

    # Create layouts directory and files
    layouts_dir = os.path.join(base_dir, "layouts")
    os.makedirs(layouts_dir, exist_ok=True)
    create_file(os.path.join(layouts_dir, "default.tsx"), "// Default layout")
    create_file(os.path.join(layouts_dir, "admin.tsx"), "// Admin layout")
    create_file(os.path.join(layouts_dir, "auth.tsx"), "// Auth layout")

    # Create pages directory and files
    pages_dir = os.path.join(base_dir, "pages")
    os.makedirs(pages_dir, exist_ok=True)
    create_file(os.path.join(pages_dir, "home.tsx"), "// Home page component")
    create_file(os.path.join(pages_dir, "about.tsx"), "// About page")
    create_file(os.path.join(pages_dir, "contact.tsx"), "// Contact page")

    # Create components directory and files
    components_dir = os.path.join(base_dir, "components")
    os.makedirs(components_dir, exist_ok=True)
    create_file(os.path.join(components_dir, "header.tsx"), "// Site header")
    create_file(os.path.join(components_dir, "footer.tsx"), "// Site footer")
    create_file(os.path.join(components_dir, "hero.tsx"), "// Hero section")
    create_file(os.path.join(components_dir, "feature-grid.tsx"), "// Features grid")

    # Create assets directory and subdirectories
    assets_dir = os.path.join(base_dir, "assets")
    os.makedirs(assets_dir, exist_ok=True)

    # Create assets/css directory and files
    css_dir = os.path.join(assets_dir, "css")
    os.makedirs(css_dir, exist_ok=True)
    create_file(os.path.join(css_dir, "theme.css"), "/* Theme styles */")

    # Create assets/images directory and files
    images_dir = os.path.join(assets_dir, "images")
    os.makedirs(images_dir, exist_ok=True)
    create_file(os.path.join(images_dir, "logo.svg"), "<!-- Default logo -->")
    create_file(os.path.join(images_dir, "hero-bg.jpg"), "/* Hero background */")

    # Create assets/fonts directory and files
    fonts_dir = os.path.join(assets_dir, "fonts")
    os.makedirs(fonts_dir, exist_ok=True)
    create_file(os.path.join(fonts_dir, "inter.woff2"), "/* Custom fonts */")

if __name__ == "__main__":
    create_default_theme_structure()
    print("Default theme folder structure created successfully!")