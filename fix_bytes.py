# Fix escapeHtml mappings using bytes
with open('/mnt/d/CODE/Invoice generator/js/utils.js', 'rb') as f:
    content = f.read()

# Fix the escapeHtml mappings - replace literal chars with HTML entities
content = content.replace(b"'&': '&',", b"'&': '&',")
content = content.replace(b"'<': '<',", b"'<': '<',")
content = content.replace(b"'>': '>',", b"'>': '>',")
content = content.replace(b"'\"': '\"',", b"'\"': '\"',")

with open('/mnt/d/CODE/Invoice generator/js/utils.js', 'wb') as f:
    f.write(content)

print('Done')