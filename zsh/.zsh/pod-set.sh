#!/bin/bash

# Source the aliases.sh file to make the gitbra function available
source "$HOME/.zsh/aliases.sh"

# ANSI color codes
RED='\033[0;31m'
BRIGHT_PINK='\033[38;5;213m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if at least one argument is provided
if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <pods|services|git-branch> [-A]" >&2
    exit 1
fi

# Set the resource type based on the first argument
resource_type="$1"

if [ "$resource_type" == "git-branch" ]; then
    # Run gitbra and store the output
    git_output=$(gitbra)

    # Extract the header
    header=$(echo "$git_output" | head -n 1)

    # Print the header with a # prefix in bright orange-pink
    echo -e "${BRIGHT_PINK}# ${header}${NC}" >&2

    # Process and print the rest of the output with colored line numbers
    # Also, store branch names in an array
    branch_names=()
    while IFS= read -r line; do
        echo -e "${RED}$((${#branch_names[@]}+1))${NC} $line" >&2
        branch_name=$(echo "$line" | awk '{print $1}')
        branch_names+=("$branch_name")
    done < <(echo "$git_output" | tail -n +2)

    # Get the number of branches
    num_branches=${#branch_names[@]}

    # Prompt user for input
    while true; do
        echo -e "\n${YELLOW}Enter the number of the branch you want to select (1-$num_branches):${NC}" >&2
        read -r selection

        # Validate input
        if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le "$num_branches" ]; then
            selected_branch=${branch_names[$selection-1]}
            # Trim any extra whitespace or special characters
            selected_branch=$(echo "$selected_branch" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
            echo -e "${GREEN}Selected branch: $selected_branch${NC}" >&2
            echo "export BRANCH='$selected_branch'"
            break
        else
            echo -e "${RED}Invalid input. Please enter a number between 1 and $num_branches.${NC}" >&2
        fi
    done
else

    # Run kubectl get pods/services and store the output
    if [ "$2" == "-A" ]; then
        kubectl_output=$(kubectl get $resource_type -A)
    else
        kubectl_output=$(kubectl get $resource_type)
    fi

    # Extract the header
    header=$(echo "$kubectl_output" | head -n 1)

    # Print the header with a # prefix in bright orange-pink
    echo -e "${BRIGHT_PINK}# ${header}${NC}" >&2

    # Process and print the rest of the output with colored line numbers and green "Running" status
    # Also, store resource names in an array
    resource_names=()
    while IFS= read -r line; do
        if [[ "$resource_type" == "pods" && "$line" == *"Running"* ]]; then
            echo -e "${RED}$((${#resource_names[@]}+1))${NC} ${line/Running/${GREEN}Running${NC}}" >&2
        else
            echo -e "${RED}$((${#resource_names[@]}+1))${NC} $line" >&2
        fi
        resource_name=$(echo "$line" | awk '{print $1}')
        resource_names+=("$resource_name")
    done < <(echo "$kubectl_output" | tail -n +2)

    # Get the number of resources
    num_resources=${#resource_names[@]}

    # Prompt user for input
    while true; do
        echo -e "\n${YELLOW}Enter the number of the $resource_type you want to select (1-$num_resources):${NC}" >&2
        read -r selection

        # Validate input
        if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le "$num_resources" ]; then
            selected_resource=${resource_names[$selection-1]}
            echo -e "${GREEN}Selected $resource_type: $selected_resource${NC}" >&2
            if [[ "$resource_type" == "pods" ]]; then
                echo "export POD='$selected_resource'"
            else
                echo "export SERVICE='$selected_resource'"
            fi
            break
        else
            echo -e "${RED}Invalid input. Please enter a number between 1 and $num_resources.${NC}" >&2
        fi
    done
fi
