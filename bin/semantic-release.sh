#!/bin/bash

set -e

# Set new version
semantic-release pre

# Remove all devDeps so shrinkwrap does not pick them up.
# Shrinkwrap shouldn't pick up devDeps, but there is a bug so it picks up the
# dependencies of devDependencies. This works around it.
npm prune --production

# Write shrinkwrap with only production deps
npm shrinkwrap

# Run regular publish
npm publish

# Reinstall semantic-release, because it had to be deleted before.
npm install @semantic-release/condition-travis@$npm_package_devDependencies__semantic_release_condition_travis
npm install semantic-release@$npm_package_devDependencies_semantic_release

# Generate and upload changelog
semantic-release post

# Tell Greenkeeper about the new version
npm install greenkeeper-postpublish@$npm_package_devDependencies_greenkeeper_postpublish
greenkeeper-postpublish
