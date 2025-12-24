#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hr_system.settings')
django.setup()

from django.contrib.auth.models import User

if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('[SUCCESS] Superuser "admin" created successfully!')
    print('  Username: admin')
    print('  Email: admin@example.com')
    print('  Password: admin123')
else:
    print('[INFO] Superuser "admin" already exists!')
