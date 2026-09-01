with open('/mnt/d/CODE/Invoice generator/js/utils.js', 'rb') as f:
    content = f.read()

# Replace literal chars with HTML entities using explicit byte sequences
# '&': '&',  -> '&': '&',  (0x26 0x61 0x6d 0x70 0x3b)
content = content.replace(b"'&': '&',", b"'&': '&',")
# '<': '<',  -> '<': '<',  (0x26 0x6c 0x74 0x3b)
content = content.replace(b"'<': '<',", b"'<': '<',")
# '>': '>',  -> '>': '>',  (0x26 0x67 0x74 0x3b)
content = content.replace(b"'>': '>',", b"'>': '>',")
# '"': '"',  -> '"': '"',  (0x26 0x71 0x75 0x6f 0x74 0x3b)
content = content.replace(b"'\"': '\"',", b"'\"': '\"',")

with open('/mnt/d/CODE/Invoice generator/js/utils.js', 'wb') as f:
    f.write(content)

print('Done')