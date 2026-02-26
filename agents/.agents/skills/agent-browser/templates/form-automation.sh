#!/bin/bash
# Template: Form Automation Workflow
# Purpose: Fill and submit web forms with validation
# Usage: ./form-automation.sh <form-url>
#
# This template demonstrates the snapshot-interact-verify pattern:
# 1. Navigate to form
# 2. Snapshot to get element refs
# 3. Fill fields using refs
# 4. Submit and verify result
#
# Customize: Update the refs (@e1, @e2, etc.) based on your form's snapshot output

set -euo pipefail

FORM_URL="${1:?Usage: $0 <form-url>}"

echo "Form automation: $FORM_URL"

# Step 1: Navigate to form
npx agent-browser open "$FORM_URL"
npx agent-browser wait --load networkidle

# Step 2: Snapshot to discover form elements
echo ""
echo "Form structure:"
npx agent-browser snapshot -i

# Step 3: Fill form fields (customize these refs based on snapshot output)
#
# Common field types:
#   npx agent-browser fill @e1 "John Doe"           # Text input
#   npx agent-browser fill @e2 "user@example.com"   # Email input
#   npx agent-browser fill @e3 "SecureP@ss123"      # Password input
#   npx agent-browser select @e4 "Option Value"     # Dropdown
#   npx agent-browser check @e5                     # Checkbox
#   npx agent-browser click @e6                     # Radio button
#   npx agent-browser fill @e7 "Multi-line text"   # Textarea
#   npx agent-browser upload @e8 /path/to/file.pdf # File upload
#
# Uncomment and modify:
# npx agent-browser fill @e1 "Test User"
# npx agent-browser fill @e2 "test@example.com"
# npx agent-browser click @e3  # Submit button

# Step 4: Wait for submission
# npx agent-browser wait --load networkidle
# npx agent-browser wait --url "**/success"  # Or wait for redirect

# Step 5: Verify result
echo ""
echo "Result:"
npx agent-browser get url
npx agent-browser snapshot -i

# Optional: Capture evidence
npx agent-browser screenshot /tmp/form-result.png
echo "Screenshot saved: /tmp/form-result.png"

# Cleanup
npx agent-browser close
echo "Done"
