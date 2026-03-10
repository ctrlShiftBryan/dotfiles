#!/usr/bin/env bash
# analyze_structure.sh — Screaming Architecture Scanner
# Detects project type and scans for architecture violations.
# Usage: bash analyze_structure.sh [project-root]
# Output: JSON to stdout with findings

set -euo pipefail

PROJECT_ROOT="${1:-.}"
cd "$PROJECT_ROOT"

# --- Project Type Detection ---

IS_EXPO=false
IS_WEB_REACT=false
HAS_CONVEX=false

if [[ -f "app.json" ]] && grep -q '"expo"' app.json 2>/dev/null; then
  IS_EXPO=true
elif [[ -f "app.config.ts" ]] && grep -q 'expo' app.config.ts 2>/dev/null; then
  IS_EXPO=true
elif [[ -f "app.config.js" ]] && grep -q 'expo' app.config.js 2>/dev/null; then
  IS_EXPO=true
fi

if [[ -d "src" ]] && [[ "$IS_EXPO" == "false" ]]; then
  IS_WEB_REACT=true
fi

if [[ -d "convex" ]]; then
  HAS_CONVEX=true
fi

# --- Helper Functions ---

json_array() {
  local items=("$@")
  if [[ ${#items[@]} -eq 0 ]]; then
    echo "[]"
    return
  fi
  local result="["
  local first=true
  for item in "${items[@]}"; do
    if [[ "$first" == "true" ]]; then
      first=false
    else
      result+=","
    fi
    # Escape quotes in the item
    item="${item//\\/\\\\}"
    item="${item//\"/\\\"}"
    result+="\"$item\""
  done
  result+="]"
  echo "$result"
}

count_lines() {
  local file="$1"
  wc -l < "$file" | tr -d ' '
}

# --- Findings Storage ---

VIOLATIONS=()
WARNINGS=()
NOTES=()

add_violation() {
  VIOLATIONS+=("$1")
}

add_warning() {
  WARNINGS+=("$1")
}

add_note() {
  NOTES+=("$1")
}

# --- Expo-Specific Scans ---

expo_scan() {
  echo "Scanning Expo React Native project..." >&2

  # 1. Non-route files in app/
  if [[ -d "app" ]]; then
    local non_route_files=()
    while IFS= read -r -d '' file; do
      local basename
      basename=$(basename "$file")
      # Route files: *.tsx, _layout.tsx, +not-found.tsx, +html.tsx
      # Non-route: *.ts (not .tsx), utils.*, helpers.*, etc.
      case "$basename" in
        _layout.tsx|+not-found.tsx|+html.tsx) continue ;;
        *.tsx) continue ;;  # .tsx files are valid routes
        *) non_route_files+=("$file") ;;
      esac
    done < <(find app -type f \( -name "*.ts" -o -name "*.js" -o -name "*.jsx" \) -print0 2>/dev/null)

    for f in "${non_route_files[@]}"; do
      add_violation "Non-route file in app/: $f"
    done
  fi

  # 2. Route group validation — _layout.tsx exists in each (group)/
  if [[ -d "app" ]]; then
    while IFS= read -r -d '' dir; do
      local dirname
      dirname=$(basename "$dir")
      if [[ "$dirname" == "("*")" ]]; then
        if [[ ! -f "$dir/_layout.tsx" ]]; then
          add_violation "Route group missing _layout.tsx: $dir"
        fi
      fi
    done < <(find app -type d -print0 2>/dev/null)
  fi

  # 3. Provider leak detection — <Provider outside _layout.tsx
  if [[ -d "app" ]]; then
    local provider_leaks
    provider_leaks=$(grep -rn '<[A-Z][A-Za-z]*Provider' app/ --include="*.tsx" 2>/dev/null | grep -v "_layout" || true)
    if [[ -n "$provider_leaks" ]]; then
      while IFS= read -r line; do
        add_violation "Provider outside _layout.tsx: $line"
      done <<< "$provider_leaks"
    fi
  fi

  # 4. Screen thickness — flag screens >50 lines
  if [[ -d "app" ]]; then
    while IFS= read -r -d '' file; do
      local basename
      basename=$(basename "$file")
      # Skip layout files
      [[ "$basename" == "_layout.tsx" ]] && continue
      [[ "$basename" == "+not-found.tsx" ]] && continue

      local lines
      lines=$(count_lines "$file")
      if [[ "$lines" -gt 100 ]]; then
        add_violation "Fat screen ($lines lines): $file"
      elif [[ "$lines" -gt 50 ]]; then
        add_warning "Thick screen ($lines lines): $file"
      fi
    done < <(find app -name "*.tsx" -type f -print0 2>/dev/null)
  fi

  # 5. Feature-route alignment
  if [[ -d "features" ]]; then
    while IFS= read -r -d '' dir; do
      local domain
      domain=$(basename "$dir")
      # Check if any route references this feature
      local route_refs
      route_refs=$(grep -rl "@/features/$domain" app/ --include="*.tsx" 2>/dev/null || true)
      if [[ -z "$route_refs" ]]; then
        add_warning "Feature with no route references: features/$domain"
      fi
    done < <(find features -mindepth 1 -maxdepth 1 -type d -print0 2>/dev/null)
  fi

  # 6. Convex boundary — api.* imports outside features/*/hooks/
  local boundary_violations
  # Check app/ for api imports
  boundary_violations=$(grep -rn "from.*convex/_generated/api\|from.*@/convex/_generated/api" app/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "_layout.tsx" || true)
  if [[ -n "$boundary_violations" ]]; then
    while IFS= read -r line; do
      add_violation "Convex api.* import in screen: $line"
    done <<< "$boundary_violations"
  fi

  # Check components/ for api imports
  if [[ -d "components" ]]; then
    boundary_violations=$(grep -rn "from.*convex/_generated/api\|from.*@/convex/_generated/api" components/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)
    if [[ -n "$boundary_violations" ]]; then
      while IFS= read -r line; do
        add_violation "Convex api.* import in components/: $line"
      done <<< "$boundary_violations"
    fi
  fi

  # Check shared/ for api imports
  if [[ -d "shared" ]]; then
    boundary_violations=$(grep -rn "from.*convex\|from.*react" shared/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)
    if [[ -n "$boundary_violations" ]]; then
      while IFS= read -r line; do
        add_violation "Non-pure import in shared/: $line"
      done <<< "$boundary_violations"
    fi
  fi

  # 7. Platform file scan — verify base files exist
  while IFS= read -r -d '' file; do
    local base_file
    base_file="${file/.web.tsx/.tsx}"
    base_file="${base_file/.web.ts/.ts}"
    base_file="${base_file/.ios.tsx/.tsx}"
    base_file="${base_file/.ios.ts/.ts}"
    base_file="${base_file/.android.tsx/.tsx}"
    base_file="${base_file/.android.ts/.ts}"
    if [[ "$base_file" != "$file" ]] && [[ ! -f "$base_file" ]]; then
      add_warning "Platform file without base: $file (expected $base_file)"
    fi
  done < <(find . -maxdepth 4 \( -name "*.web.tsx" -o -name "*.web.ts" -o -name "*.ios.tsx" -o -name "*.ios.ts" -o -name "*.android.tsx" -o -name "*.android.ts" \) -print0 2>/dev/null)

  # 8. Cross-feature imports
  if [[ -d "features" ]]; then
    while IFS= read -r -d '' feature_dir; do
      local domain
      domain=$(basename "$feature_dir")
      # Look for imports from other features
      local cross_imports
      cross_imports=$(grep -rn "@/features/" "$feature_dir" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "@/features/$domain" || true)
      if [[ -n "$cross_imports" ]]; then
        while IFS= read -r line; do
          add_violation "Cross-feature import: $line"
        done <<< "$cross_imports"
      fi
    done < <(find features -mindepth 1 -maxdepth 1 -type d -print0 2>/dev/null)
  fi

  # 9. src/ directory check
  if [[ -d "src" ]]; then
    add_warning "src/ directory exists in Expo project — Expo convention uses root-level directories"
  fi
}

# --- Web React Scans ---

web_scan() {
  echo "Scanning Web React project..." >&2

  if [[ ! -d "src" ]]; then
    add_warning "No src/ directory found for web React project"
    return
  fi

  # Page thickness
  if [[ -d "src/pages" ]]; then
    while IFS= read -r -d '' file; do
      local lines
      lines=$(count_lines "$file")
      if [[ "$lines" -gt 100 ]]; then
        add_violation "Fat page ($lines lines): $file"
      elif [[ "$lines" -gt 50 ]]; then
        add_warning "Thick page ($lines lines): $file"
      fi
    done < <(find src/pages -name "*.tsx" -type f -print0 2>/dev/null)
  fi

  # Feature existence
  if [[ ! -d "src/features" ]]; then
    add_violation "No src/features/ directory — codebase does not scream its domain"
  fi

  # Pure lib check
  if [[ -d "src/lib" ]]; then
    local react_in_lib
    react_in_lib=$(grep -rn "from ['\"]react" src/lib/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)
    if [[ -n "$react_in_lib" ]]; then
      while IFS= read -r line; do
        add_violation "React import in lib/: $line"
      done <<< "$react_in_lib"
    fi
  fi
}

# --- Convex Scans ---

convex_scan() {
  echo "Scanning Convex backend..." >&2

  if [[ ! -d "convex" ]]; then
    return
  fi

  # Check for domain subdirectories
  local domain_dirs=()
  while IFS= read -r -d '' dir; do
    local dirname
    dirname=$(basename "$dir")
    [[ "$dirname" == "_generated" ]] && continue
    [[ "$dirname" == "node_modules" ]] && continue
    domain_dirs+=("$dirname")
  done < <(find convex -mindepth 1 -maxdepth 1 -type d -print0 2>/dev/null)

  if [[ ${#domain_dirs[@]} -eq 0 ]]; then
    add_warning "No domain subdirectories in convex/ — consider organizing by domain"
  fi

  # Check for schema composition
  if [[ -f "convex/schema.ts" ]]; then
    local imports_count
    imports_count=$(grep -c "import.*from" convex/schema.ts 2>/dev/null || echo "0")
    if [[ "$imports_count" -lt 2 ]] && [[ ${#domain_dirs[@]} -gt 1 ]]; then
      add_warning "convex/schema.ts has few imports — consider splitting into domain schema files"
    fi
  fi

  # Check for helpers pattern
  for domain in "${domain_dirs[@]}"; do
    if [[ -d "convex/$domain" ]]; then
      local has_helpers=false
      [[ -f "convex/$domain/helpers.ts" ]] && has_helpers=true

      local has_queries=false
      [[ -f "convex/$domain/queries.ts" ]] && has_queries=true

      local has_mutations=false
      [[ -f "convex/$domain/mutations.ts" ]] && has_mutations=true

      if [[ "$has_queries" == "true" || "$has_mutations" == "true" ]] && [[ "$has_helpers" == "false" ]]; then
        add_note "convex/$domain/ has queries/mutations but no helpers.ts — consider extracting logic"
      fi
    fi
  done

  # Check for .filter() usage (should use .withIndex())
  local filter_usage
  filter_usage=$(grep -rn "\.filter(" convex/ --include="*.ts" 2>/dev/null | grep -v "_generated" | grep -v "node_modules" || true)
  if [[ -n "$filter_usage" ]]; then
    while IFS= read -r line; do
      add_warning "Possible .filter() usage (prefer .withIndex()): $line"
    done <<< "$filter_usage"
  fi
}

# --- General Scans ---

general_scan() {
  # Check features/ exists
  local features_dir="features"
  [[ "$IS_WEB_REACT" == "true" ]] && features_dir="src/features"

  if [[ -d "$features_dir" ]]; then
    local domain_count
    domain_count=$(find "$features_dir" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
    add_note "Found $domain_count feature domains in $features_dir/"

    # List domains
    while IFS= read -r -d '' dir; do
      local domain
      domain=$(basename "$dir")
      add_note "Domain: $domain"
    done < <(find "$features_dir" -mindepth 1 -maxdepth 1 -type d -print0 2>/dev/null)
  else
    add_violation "No features/ directory — codebase does not scream its domain"
  fi
}

# --- Run Scans ---

echo "Analyzing project at: $(pwd)" >&2
echo "Project type: Expo=$IS_EXPO, WebReact=$IS_WEB_REACT, Convex=$HAS_CONVEX" >&2

general_scan

if [[ "$IS_EXPO" == "true" ]]; then
  expo_scan
elif [[ "$IS_WEB_REACT" == "true" ]]; then
  web_scan
fi

if [[ "$HAS_CONVEX" == "true" ]]; then
  convex_scan
fi

# --- Output JSON ---

cat << ENDJSON
{
  "project_root": "$(pwd)",
  "project_type": {
    "expo": $IS_EXPO,
    "web_react": $IS_WEB_REACT,
    "convex": $HAS_CONVEX
  },
  "summary": {
    "violations": ${#VIOLATIONS[@]},
    "warnings": ${#WARNINGS[@]},
    "notes": ${#NOTES[@]}
  },
  "violations": $(json_array "${VIOLATIONS[@]+"${VIOLATIONS[@]}"}"),
  "warnings": $(json_array "${WARNINGS[@]+"${WARNINGS[@]}"}"),
  "notes": $(json_array "${NOTES[@]+"${NOTES[@]}"}")
}
ENDJSON

echo "" >&2
echo "Done. Violations: ${#VIOLATIONS[@]}, Warnings: ${#WARNINGS[@]}, Notes: ${#NOTES[@]}" >&2
