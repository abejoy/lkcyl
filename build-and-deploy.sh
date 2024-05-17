#!/bin/bash
# Check if STAGE environment variable is set
if [ -z "$STAGE" ]; then
  echo "STAGE environment variable is not set!"
  exit 1
fi
echo "Stage name is: $STAGE"

# Function to run commands with environment variables and handle errors
run_command() {
  local command=$1
  local work_dir=$2
  echo "Executing: $command in $work_dir"
  (cd "$work_dir" && eval "$command")
  if [ $? -ne 0 ]; then
    echo "Command failed: $command"
    exit 1
  fi
}

# Function to ask questions and get user input
ask_question() {
  local question=$1
  local answer
  read -p "$question" answer
  echo $answer
}

# Build the project
run_command "npm run build" "$(pwd)"

# Ask user if they want to run the backend stack
answer=$(ask_question "Do you want to run ${STAGE}LkcylStack? (y/n) ")
if [ "$answer" = "y" ]; then
  run_command "npx cdk deploy ${STAGE}LkcylStack" "$(pwd)"
fi

# Ask user if they want to install and build the frontend app
answer=$(ask_question "Do you want to install and build the front end app, this can be your opportunity to update aws-exports? (y/n) ")
if [ "$answer" = "y" ]; then
  run_command "npm i" "$(pwd)/frontend"
  run_command "npm run build" "$(pwd)/frontend"
fi

# # Ask user if they want to run the certificate stack
answer=$(ask_question "Do you want to run ${STAGE}CertificateStack? (y/n) ")
if [ "$answer" = "y" ]; then
  run_command "npx cdk deploy ${STAGE}CertificateStack" "$(pwd)"
fi

# # Ask user if they want to run build again
answer=$(ask_question "Do you want to npm run build again, this is your oppertunity to update the certificatsArn in the front end stack? (y/n) ")
if [ "$answer" = "y" ]; then
  run_command "npm run build" "$(pwd)"
fi

# # Ask user if they want to run the frontend stack
answer=$(ask_question "Do you want to run ${STAGE}FrontEndStack? (y/n) ")
if [ "$answer" = "y" ]; then
  run_command "npx cdk deploy ${STAGE}FrontEndStack" "$(pwd)"
fi
