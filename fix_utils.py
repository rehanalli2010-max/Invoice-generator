import re

with open('/mnt/d/CODE/Invoice generator/js/utils.js', 'r') as f:
    content = f.read()

# Fix escapeHtml mappings - replace the incorrect mappings with correct ones
# The current file has literal & < > " which are wrong
# They should be & < > "

# Line 13: '&': '&',  -> '&': '&',
content = content.replace("'&': '&',", "'&': '&',")

# Line 14: '<': '<',  -> '<': '<',
content = content.replace("'<': '<',", "'<': '<',")

# Line 15: '>': '>',  -> '>': '>',
content = content.replace("'>': '>',", "'>': '>',")

# Line 16: '"': '"',  -> '"': '"',
content = content.replace("'\"': '\"',", "'\"': '\"',")

with open('/mnt/d/CODE/Invoice generator/js/utils.js', 'w') as f:
    f.write(content)

print('Done')