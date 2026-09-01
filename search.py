import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# find Create Invoice
idx = text.find('Create Invoice')
if idx != -1:
    print(text[idx-500:idx+500])
