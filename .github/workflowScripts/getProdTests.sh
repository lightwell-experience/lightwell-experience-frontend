#!/bin/bash

# Default values for URL and target string
DEFAULT_URL="https://gitlab.cee.redhat.com/service/app-interface/-/raw/master/data/services/lightwell-experience/cicd/saas.yaml"
DEFAULT_TARGET_STRING="/services/insights/frontend-operator/namespaces/prod-frontends.yml"

# Use defaults for URL and target string
url=$DEFAULT_URL
target_string=$DEFAULT_TARGET_STRING

# Download the YAML file, ignoring certificate requirements
yaml_file="downloaded_file.yml"
curl -k -s -o $yaml_file $url

# Check if curl command was successful
if [ $? -ne 0 ]; then
  echo "Failed to download the file from $url"
  exit 1
fi

# Check if the downloaded file is empty or not found
if [ ! -s $yaml_file ]; then
  echo "The file is empty or not found."
  exit 1
fi

# Parse the YAML file to find the target string and return the next line without "ref: "
commit_hash=$(awk -v target="$target_string" '
{
    if ($0 ~ target) {
        getline
        if ($0 ~ /^ *ref: /) {
            sub(/^ *ref: /, "", $0)
            print $0
            exit
        }
    }
}' $yaml_file)

# Check if the commit hash was found
if [ -z "$commit_hash" ]; then
  echo "The specified target string was not found in the YAML file."
  exit 1
else
  echo "The commit hash is: $commit_hash"
fi

# Clean up
rm $yaml_file

git fetch origin "$commit_hash"
git checkout "$commit_hash"
