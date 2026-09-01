with open('/mnt/d/CODE/Invoice generator/js/utils.js', 'rb') as f:
    content = f.read()

# Replace literal chars with HTML entities
# The replacement strings contain literal HTML entity text: & < > "
content = content.replace(b"'&': '&',", b"'&': '&',")
content = content.replace(b"'<': '<',", b"'<': '<',")
content = content.replace(b"'>': '>',", b"'>': '>',")
content = content.replace(b"'\"': '\"',", b"'\"': '\"',")

with open('/mnt/d/CODE/Invoice generator/js/utils.js', 'wb') as f:
    f.write(content)

print('Done')
