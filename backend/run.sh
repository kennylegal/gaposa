#!/usr/bin/env bash


py manage.py seed_demo || true
echo ""
echo "API:   http://localhost:8000/api/"
echo "Admin: http://localhost:8000/admin/"
echo ""
py manage.py runserver
