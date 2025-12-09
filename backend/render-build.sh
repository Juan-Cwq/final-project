#!/bin/bash
# Render build script

# Install system dependencies
apt-get update
apt-get install -y libgl1-mesa-glx libglib2.0-0

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
