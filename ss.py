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
    create_file(os.path.join(base_dir, "index.js"), "// Main entry point")
    create_file(os.path.join(base_dir, "styles.css"), "/* Theme styles */")
    create_file(os.path.join(base_dir, "preview.jpg"), "/* Theme preview image */")

    # Create layouts directory and files
    layouts_dir = os.path.join(base_dir, "layouts")
    os.makedirs(layouts_dir, exist_ok=True)
    create_file(os.path.join(layouts_dir, "default.tsx"), "// Default layout")
    create_file(os.path.join(layouts_dir, "admin.tsx"), "// Admin layout")
    create_file(os.path.join(layouts_dir, "auth.tsx"), "// Authentication layout")

    # Create components directory and files
    components_dir = os.path.join(base_dir, "components")
    os.makedirs(components_dir, exist_ok=True)
    create_file(os.path.join(components_dir, "header.tsx"), "// Site header")
    create_file(os.path.join(components_dir, "footer.tsx"), "// Site footer")
    create_file(os.path.join(components_dir, "navigation.tsx"), "// Main navigation")
    create_file(os.path.join(components_dir, "hero-section.tsx"), "// Homepage hero")
    create_file(os.path.join(components_dir, "features-section.tsx"), "// Features section")
    create_file(os.path.join(components_dir, "stats-section.tsx"), "// Statistics section")
    create_file(os.path.join(components_dir, "cta-section.tsx"), "// Call-to-action section")
    create_file(os.path.join(components_dir, "testimonials-section.tsx"), "// Testimonials section")

    # Create pages directory and files
    pages_dir = os.path.join(base_dir, "pages")
    os.makedirs(pages_dir, exist_ok=True)
    create_file(os.path.join(pages_dir, "homepage.tsx"), "// Homepage component")
    create_file(os.path.join(pages_dir, "about.tsx"), "// About page")
    create_file(os.path.join(pages_dir, "contact.tsx"), "// Contact page")

    # Create assets directory and subdirectories
    assets_dir = os.path.join(base_dir, "assets")
    os.makedirs(assets_dir, exist_ok=True)

    # Create assets/images directory and files
    images_dir = os.path.join(assets_dir, "images")
    os.makedirs(images_dir, exist_ok=True)
    create_file(os.path.join(images_dir, "logo.svg"), "<!-- Default logo -->")
    create_file(os.path.join(images_dir, "hero-bg.jpg"), "/* Hero background */")
    create_file(os.path.join(images_dir, "feature-1.svg"), "<!-- Feature icon 1 -->")
    create_file(os.path.join(images_dir, "feature-2.svg"), "<!-- Feature icon 2 -->")
    create_file(os.path.join(images_dir, "feature-3.svg"), "<!-- Feature icon 3 -->")

    # Create assets/fonts directory and files
    fonts_dir = os.path.join(assets_dir, "fonts")
    os.makedirs(fonts_dir, exist_ok=True)
    create_file(os.path.join(fonts_dir, "inter-var.woff2"), "/* Inter font */")
    create_file(os.path.join(fonts_dir, "poppins-var.woff2"), "/* Poppins font */")

    # Create assets/icons directory and files
    icons_dir = os.path.join(assets_dir, "icons")
    os.makedirs(icons_dir, exist_ok=True)
    create_file(os.path.join(icons_dir, "check.svg"), "<!-- Check icon -->")
    create_file(os.path.join(icons_dir, "arrow-right.svg"), "<!-- Arrow icon -->")
    create_file(os.path.join(icons_dir, "star.svg"), "<!-- Star icon -->")

if __name__ == "__main__":
    create_default_theme_structure()
    print("Default theme folder structure created successfully!")