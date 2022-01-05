#!/usr/bin/python3
# csv-reader.py: Example of CSV parsing in python
import sys
import os
import io
import csv
import textwrap

if len(sys.argv) > 1 and sys.argv[1] == 'win':
  system = 'win'
  comment = '::'
  command = 'set'
  launch = 'stig-manager-win.exe'
  filename = 'stig-manager.bat'
  newline = '\r\n'
else:
  system = 'linux'
  comment = '#'
  command = 'export'
  launch = './stig-manager-linuxstatic'
  filename = 'stig-manager.sh'
  newline = '\n'


with open('../../../docs/installation-and-setup/envvars.csv', 'r') as csvfile:
    reader = csv.DictReader(csvfile)
    with io.open(filename, 'w', newline=newline) as f:
      for row in reader:
          row['Description'] = row['Description'].replace('**Default**', 'Default:')
          row['Description'] = row['Description'].replace('**No default**', 'No default.')
          row['Description'] = row['Description'].replace('``', '"')
          row['Description'] = '\n'.join(textwrap.wrap(row['Description'], width=80, initial_indent=comment + '  ', subsequent_indent=comment + '  '))
          f.write('{0}==============================================================================\n'.format(comment))
          content = '{0} {1}\n{0}\n{2}\n{0}\n{0}  Affects: {3}\n'.format(comment, row['Variable'], row['Description'], row['Affects'])
          f.write(content)
          f.write('{0}==============================================================================\n'.format(comment))
          f.write('{0} {1} {2}=\n'.format(comment, command, row['Variable']))
          f.write('\n')
      f.write(launch + '\n')

if system == 'linux':
  os.chmod(filename, 0o755)
