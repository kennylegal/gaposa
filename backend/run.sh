#!/usr/bin/env bash

pip install -q --upgrade pip
pip install -q -r requirements.txt
py manage.py makemigrations clinic --noinput
py manage.py migrate --noinput
py manage.py init_users
py manage.py seed_demo || true
echo ""
echo "API:   http://localhost:8000/api/"
echo "Admin: http://localhost:8000/admin/"
echo ""
py manage.py runserver
