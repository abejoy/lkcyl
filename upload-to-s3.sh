#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Load environment variables from .env file
if [[ -f ".env" ]]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "Error: .env file not found in the root of the repository."
  exit 1
fi

# Check if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set
if [[ -z "$AWS_ACCESS_KEY_ID" || -z "$AWS_SECRET_ACCESS_KEY" ]]; then
  echo "Error: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set in the .env file."
  exit 1
fi

# Define variables
BUCKET_NAME="abefrontendstacklkcylwebsitebucket"
FRONTEND_FOLDER="./frontend"
BUILD_FOLDER="$FRONTEND_FOLDER/build"

cd "$FRONTEND_FOLDER"

# Install dependencies
echo "Installing dependencies..."
npm install

# Run the build process
echo "Building the frontend..."
npm run build

# Navigate back to the root directory
cd -

# Check if the build folder exists
if [[ ! -d "$BUILD_FOLDER" ]]; then
  echo "Error: Build folder does not exist. Please run the build process first."
  exit 1
fi

# Sync the build folder to the S3 bucket
echo "Uploading contents of $BUILD_FOLDER to S3 bucket $BUCKET_NAME..."
aws s3 sync "$BUILD_FOLDER" "s3://$BUCKET_NAME" --delete

echo "Upload complete!"