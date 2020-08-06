# Dependencies
- imagemagick
- scanimage (sane)

# Set-up
- Create `/scans` and `/saves` directories at the root level
- Edit `/etc/ImageMagick-6/policy.xml` and add `<policy domain="coder" rights="read|write" pattern="PDF" />`
