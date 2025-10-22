# claude code
# claude 
# Function to preserve original directory for hooks
cc() {
    export CLAUDE_ORIGINAL_DIR="$PWD"
    claude "$@"
}
ccc() {
    export CLAUDE_ORIGINAL_DIR="$PWD"
    claude --resume query "$@"
}
ccd() {
    export CLAUDE_ORIGINAL_DIR="$PWD"
    claude --dangerously-skip-permissions "$@"
}
cccd() {
    export CLAUDE_ORIGINAL_DIR="$PWD"
    claude --dangerously-skip-permissions --resume query "$@"
}

# Claude Code with Proxyman (for debugging API calls)
# Uses Proxyman's default port 9090 with SSL certificate support
ccp() {
    export CLAUDE_ORIGINAL_DIR="$PWD"
    HTTPS_PROXY=http://127.0.0.1:9090 \
    HTTP_PROXY=http://127.0.0.1:9090 \
    NODE_EXTRA_CA_CERTS="$HOME/Library/Application Support/com.proxyman.NSProxy/proxyman-ca.pem" \
    claude "$@"
}
cccp() {
    export CLAUDE_ORIGINAL_DIR="$PWD"
    HTTPS_PROXY=http://127.0.0.1:9090 \
    HTTP_PROXY=http://127.0.0.1:9090 \
    NODE_EXTRA_CA_CERTS="$HOME/Library/Application Support/com.proxyman.NSProxy/proxyman-ca.pem" \
    claude --resume query "$@"
}
ccdp() {
    export CLAUDE_ORIGINAL_DIR="$PWD"
    HTTPS_PROXY=http://127.0.0.1:9090 \
    HTTP_PROXY=http://127.0.0.1:9090 \
    NODE_EXTRA_CA_CERTS="$HOME/Library/Application Support/com.proxyman.NSProxy/proxyman-ca.pem" \
    claude --dangerously-skip-permissions "$@"
}
cccdp() {
    export CLAUDE_ORIGINAL_DIR="$PWD"
    HTTPS_PROXY=http://127.0.0.1:9090 \
    HTTP_PROXY=http://127.0.0.1:9090 \
    NODE_EXTRA_CA_CERTS="$HOME/Library/Application Support/com.proxyman.NSProxy/proxyman-ca.pem" \
    claude --dangerously-skip-permissions --resume query "$@"
}

# Claude Code with Proxyman - Insecure mode (skip SSL verification)
# Use only for debugging when certificate issues persist
ccpi() {
    export CLAUDE_ORIGINAL_DIR="$PWD"
    HTTPS_PROXY=http://127.0.0.1:9090 \
    HTTP_PROXY=http://127.0.0.1:9090 \
    NODE_TLS_REJECT_UNAUTHORIZED=0 \
    claude "$@"
}

sshs() {
    ssh -t "$1" "cd ~/dotfiles && git pull --rebase 2>/dev/null || git clone git@github.com:ctrlShiftBryan/dotfiles.git ~/dotfiles; cd ~/dotfiles && ./setup.sh; exec \$SHELL"
}

# claude worktree versions
function ccw() {
    local current_dir=$(basename "$PWD")
    local worktrees_dir="../${current_dir}-worktrees"
    
    # Check if worktrees folder exists, create if not
    if [[ ! -d "$worktrees_dir" ]]; then
        echo "Creating worktrees directory: $worktrees_dir"
        mkdir -p "$worktrees_dir"
    fi
    
    claude --add-dir "$worktrees_dir" "$@"
}

function cccw() {
    local current_dir=$(basename "$PWD")
    local worktrees_dir="../${current_dir}-worktrees"
    
    # Check if worktrees folder exists, create if not
    if [[ ! -d "$worktrees_dir" ]]; then
        echo "Creating worktrees directory: $worktrees_dir"
        mkdir -p "$worktrees_dir"
    fi
    
    claude --resume query --add-dir "$worktrees_dir" "$@"
}

function ccdw() {
    local current_dir=$(basename "$PWD")
    local worktrees_dir="../${current_dir}-worktrees"
    
    # Check if worktrees folder exists, create if not
    if [[ ! -d "$worktrees_dir" ]]; then
        echo "Creating worktrees directory: $worktrees_dir"
        mkdir -p "$worktrees_dir"
    fi
    
    claude --dangerously-skip-permissions --add-dir "$worktrees_dir" "$@"
}

function cccdw() {
    local current_dir=$(basename "$PWD")
    local worktrees_dir="../${current_dir}-worktrees"
    
    # Check if worktrees folder exists, create if not
    if [[ ! -d "$worktrees_dir" ]]; then
        echo "Creating worktrees directory: $worktrees_dir"
        mkdir -p "$worktrees_dir"
    fi
    
    claude --dangerously-skip-permissions --resume query --add-dir "$worktrees_dir" "$@"
}

# git worktree helper
function gw() {
    # Check if branch name is provided
    if [[ -z "$1" ]]; then
        echo "Error: Please provide a branch name"
        echo "Usage: gw <branch-name>"
        return 1
    fi
    
    # Get current branch
    local current_branch=$(git branch --show-current)
    
    # Check if on main or master
    if [[ "$current_branch" != "main" && "$current_branch" != "master" ]]; then
        echo "Error: You must be on 'main' or 'master' branch to create a worktree"
        echo "Current branch: $current_branch"
        return 1
    fi
    
    # Get current directory name
    local current_dir=$(basename "$PWD")
    local worktrees_dir="../${current_dir}-worktrees"
    local new_worktree_path="${worktrees_dir}/$1"
    
    # Check if worktree path already exists
    if [[ -d "$new_worktree_path" ]]; then
        echo "Worktree already exists at: $new_worktree_path"
        echo "Changing to existing worktree directory..."
        cd "$new_worktree_path"
        echo "Changed to worktree directory: $PWD"
        return 0
    fi
    
    # Check if branch already exists
    if git show-ref --verify --quiet "refs/heads/$1"; then
        echo "Branch '$1' already exists"
        echo "Creating worktree with existing branch..."
        # Create worktrees directory if it doesn't exist
        if [[ ! -d "$worktrees_dir" ]]; then
            echo "Creating worktrees directory: $worktrees_dir"
            mkdir -p "$worktrees_dir"
        fi
        git worktree add "$new_worktree_path" "$1"
    else
        # Create worktrees directory if it doesn't exist
        if [[ ! -d "$worktrees_dir" ]]; then
            echo "Creating worktrees directory: $worktrees_dir"
            mkdir -p "$worktrees_dir"
        fi
        # Create new branch and worktree
        echo "Creating new branch '$1' and worktree at: $new_worktree_path"
        git worktree add "$new_worktree_path" -b "$1"
    fi
    
    # Change to the new worktree directory
    cd "$new_worktree_path"
    echo "Changed to worktree directory: $PWD"
}

# git worktree back - navigate back to main repository from worktree
function gwb() {
    # Check if in a git repository
    if ! git rev-parse --is-inside-work-tree &>/dev/null; then
        echo "Error: Not in a git repository"
        return 1
    fi
    
    # Get the worktree path
    local worktree_path=$(git rev-parse --show-toplevel)
    
    # Check if we're in a worktree (not the main repo)
    local git_common_dir=$(git rev-parse --git-common-dir 2>/dev/null)
    if [[ "$git_common_dir" == "$(git rev-parse --git-dir)" ]]; then
        echo "Error: You are not in a worktree. Already in the main repository."
        return 1
    fi
    
    # Get the main repository path by parsing the worktree path
    # Remove everything after and including "-worktrees" from the path
    local main_repo_path="${worktree_path%-worktrees/*}"
    
    # Check if we successfully extracted the main repo path
    if [[ "$main_repo_path" == "$worktree_path" ]]; then
        echo "Error: Unable to determine main repository path. Are you in a worktree created with 'gw'?"
        return 1
    fi
    
    # Change to main repository
    cd "$main_repo_path"
    echo "Changed to main repository: $PWD"
}

# git worktree merge - merges worktree branch back to main and removes worktree
function gwm() {
    # Get current branch
    local current_branch=$(git branch --show-current)
    
    # Check if in a worktree
    if ! git rev-parse --is-inside-work-tree &>/dev/null; then
        echo "Error: Not in a git repository"
        return 1
    fi
    
    # Get the worktree path
    local worktree_path=$(git rev-parse --show-toplevel)
    
    # Check if we're in a worktree (not the main repo)
    local git_common_dir=$(git rev-parse --git-common-dir 2>/dev/null)
    if [[ "$git_common_dir" == "$(git rev-parse --git-dir)" ]]; then
        echo "Error: You are not in a worktree. This command should be run from within a worktree."
        return 1
    fi
    
    # Determine the main branch (main or master)
    local main_branch
    if git show-ref --verify --quiet refs/heads/main; then
        main_branch="main"
    elif git show-ref --verify --quiet refs/heads/master; then
        main_branch="master"
    else
        echo "Error: Neither 'main' nor 'master' branch found."
        return 1
    fi
    
    # Get the main repository path by parsing the worktree path
    # Remove everything after and including "-worktrees" from the path
    local main_repo_path="${worktree_path%-worktrees/*}"
    
    # Check if we successfully extracted the main repo path
    if [[ "$main_repo_path" == "$worktree_path" ]]; then
        echo "Error: Unable to determine main repository path. Are you in a worktree created with 'gw'?"
        return 1
    fi
    
    echo "Current branch: $current_branch"
    echo "Worktree path: $worktree_path"
    echo "Main repo path: $main_repo_path"
    echo ""
    echo "This will:"
    echo "1. Switch to main repository"
    echo "2. Merge branch '$current_branch' into '$main_branch'"
    echo "3. Remove the worktree"
    echo ""
    echo -n "Continue? (y/N): "
    read -r REPLY
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        return 1
    fi
    
    # Change to main repository
    cd "$main_repo_path"
    
    # Ensure we're on the main branch
    git checkout "$main_branch"
    
    # Pull latest changes
    echo "Pulling latest changes on $main_branch..."
    git pull
    
    # Merge the worktree branch
    echo "Merging branch '$current_branch' into '$main_branch'..."
    if git merge "$current_branch"; then
        echo "✓ Successfully merged '$current_branch' into '$main_branch'"
        
        # Remove the worktree
        echo "Removing worktree..."
        git worktree remove "$worktree_path"
        echo "✓ Worktree removed"
        
        # Optionally delete the branch
        echo ""
        echo -n "Delete branch '$current_branch'? (y/N): "
        read -r REPLY
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git branch -d "$current_branch"
            echo "✓ Branch '$current_branch' deleted"
        fi
        
        echo ""
        echo "✓ All done! You are now on '$main_branch' in the main repository."
    else
        echo "✗ Merge failed. Please resolve conflicts and complete the merge manually."
        echo "  The worktree has NOT been removed."
        return 1
    fi
}

# Easier directory navigation.

alias ~="cd ~"
# alias .="cd .."
alias ..="cd ../.."
alias ...="cd ../../.."
alias ....="cd ../../../.."
alias cd..="cd .." # Typo addressed.
alias codei="code-insiders"

#platform dev
alias dps="docker ps -a --format \"table {{.Names}}\t{{.ID}}\t{{.Status}}\""
alias dpsp="docker ps -a --format \"table {{.Names}}\t{{.ID}}\t{{.Status}}\t{{.Ports}}\""
alias dpsi="docker ps -a --format \"table {{.Names}}\t{{.Image}}\t{{.Status}}\""
alias yad="yarn add --ignore-engines --dev"
alias datt="docker attach --detach-keys=\"ctrl-c,ctrl-c\""

# Remove all stopped containers
function drs() {
  docker rm $(docker ps -a -q -f status=exited) 2>/dev/null || echo "No stopped containers to remove"
}

#k8s
alias kubectl='kubecolor'
alias k="kubectl"
alias kgp="k get pods"

function kpf() {
  k port-forward svc/$SERVICE "$@"
}


function p() {
    local script_path="$HOME/.zsh/pod-set.sh"  # Adjust this path as needed
    if [[ ! -f "$script_path" ]]; then
        echo "Error: Script not found at $script_path"
        return 1
    fi
    local script_output
    script_output=$("$script_path" pods)
    eval "$script_output"
    echo "POD variable set to: $POD"
}


function pa() {
    local script_path="$HOME/.zsh/pod-set.sh"  # Adjust this path as needed
    if [[ ! -f "$script_path" ]]; then
        echo "Error: Script not found at $script_path"
        return 1
    fi
    local script_output
    script_output=$("$script_path" pods -A)
    eval "$script_output"
    echo "POD variable set to: $POD"
}

function s() {
    local script_path="$HOME/.zsh/pod-set.sh"  # Adjust this path as needed
    if [[ ! -f "$script_path" ]]; then
        echo "Error: Script not found at $script_path"
        return 1
    fi
    local script_output
    script_output=$("$script_path" services)
    eval "$script_output"
    echo "SERVICE variable set to: $SERVICE"
}

function ks() {
  kubectl get services "$SERVICE" "$@"
}

function kdap() {
  echo "kubectl delete all --all --dry-run=client -o name"
  kubectl delete all --all --dry-run=client -o name
}

function kdelp() {
 k delete pod $POD "$@"
}

function kdp() { 
  k describe pod $POD "$@"
}

function kl() {
  k logs $POD "$@"
}

function klf() {
  k logs -f $POD "$@"
}

function ke() {
  k exec -it $POD -- /bin/sh
}

function kberc() {
  k exec -it $POD -- bundle exec rails c
}

# cmm helm
function dh() {
  cd ~/code/kubernetes
  echo "Creating namespace $1 and installing helm chart $1"
  kubectl create namespace $1
  helm upgrade --install $1 ./helm/argocd-app-charts/argocd-app-$1 --namespace $1 --set global.ingressDomain=$(kubectl config current-context).kat.cmmaz.cloud
}

## create executable bash script
function xbash() {
  echo "" > $1
  chmod +x $1
  pbpaste >> $1
  cursor $1
}

#docker compose
function dcdu(){
  docker compose down
  docker compose up -d $@
}

function dcd(){
  docker compose down
}

function dcu(){
  docker compose up -d $@
}

function dcb(){
  docker compose build $@
}

# alias p="export POD=($1)"

function clearz() {
  printf "\ec\e[3J";
}

function curloop() {
  while true; do sleep 1; curl $@; echo -e '\n'$(date)'\n';done
}

function dci () {
  docker run -it -v $(pwd):/app $@ sh
}

function bc () {
 git checkout $BRANCH
}

function a() {
  # aider --model openai/openrouter/openai/o1-preview --architect --editor-model anthropic/claude-3-5-sonnet-20240620
  # aider --model anthropic/claude-3-5-sonnet-20240620
  aider --model openrouter/openai/o1-preview --architect --editor-model anthropic/claude-3-5-sonnet-20240620
} 

function gcr () {
  git clone --recurse-submodules $@
}

function drmi () {
  docker rmi $(docker images --filter=reference=*$@* -q)
}

function shovel () {
  pushd ~/dev
  ./script/run shovel $@
  popd
}

function mt() {
  mix test $@
}

function mte() {
  iex -S mix test --trace $@
}

function mtw() {
  mix test.watch --stale --max-failures 1 --trace --seed 0
}

function mtf() {
  mix test --only focus --trace $@
}

function mto() {
  iex -S mix test --only focus --trace $@
}

function ber() {
  bundle exec rspec $@
}

function berf() {
  bundle exec rspec --fail-fast $@
}

# function gitbra() {
#   echo "Branch | User | Commit Msg | Age"
#   git branch -r | grep -v HEAD | while read b; do
#     git log --color --format="%C(bold cyan)$b%Creset %C(bold blue)<%an>%Creset %s %C(magenta)%cr%Creset" $b | head -n 1
#   done | sort -r | sed 's;origin/;;g' | head -10
# }

function gitbra() {
  echo "Branch | sha | Age | User | Commit Msg"
  git for-each-ref --sort=committerdate refs/heads/ --format='%(refname:short); %(objectname:short); %(committerdate:relative);%(authorname)' | \
  awk -F';' '{
    printf "%s \033[33m%s\033[0m \033[32m%s\033[0m \033[36m%s\033[0m \033[35m%s\033[0m\n", $1, $2, $3, $4, $5
  }' | column -t -s ' '
}

function dri() {
  docker run -it --rm $1 $2
}

function dsr {
  docker stop $1; docker rm $1
}

function drl {
  docker restart $1; docker logs -f --tail 20 $1
}

function dstop {
  docker stop $(docker ps -qa)
}

function dhalt {
  docker stop $(docker ps --filter label=net.cmmint.dev.ansible-managed -qa)
}

function dresume {
  docker start $(docker ps --filter label=net.cmmint.dev.ansible-managed -qa)
}

function dlog {
  docker logs -f --tail 20 $1
}

function gcr() {
  git clone  --recurse-submodules $@
}

function bs() {
  # Determine the base branch (main or master)
  if git show-ref --verify --quiet refs/heads/main; then
    BASE_BRANCH="main"
  elif git show-ref --verify --quiet refs/heads/master; then
    BASE_BRANCH="master"
  else
    echo "Error: Neither 'main' nor 'master' branch found."
    return 1
  fi

  local timestamp=$(date +"%Y-%m-%d_%I_%M%p")
  local backup_branch="${BRANCH}_backup_${timestamp}"
  git checkout -b $backup_branch
  git checkout $BRANCH
  git merge $BASE_BRANCH
  git pull
  git checkout $BRANCH
  git merge $BASE_BRANCH
  git push
  git checkout $BASE_BRANCH
  git merge --squash $BRANCH
  git branch -D $BRANCH
  git checkout -b $BRANCH
}

function gsqam() {
  git pull
  branch=$(git branch | grep \* | cut -d ' ' -f2)
  myvar="_backup"
  backup_branch="$branch$myvar"
  git checkout -b $backup_branch
  git checkout $branch

  git checkout main
  git pull
  git checkout $branch
  git merge main
  git push
  git checkout main
  git merge --squash $branch
  git branch -D $branch
  git checkout -b $branch
  git commit
  git diff origin/$branch
  git push -fu origin $branch
}

function gsqa() {
  git pull
  branch=$(git branch | grep \* | cut -d ' ' -f2)
  myvar="_backup"
  backup_branch="$branch$myvar"
  git checkout -b $backup_branch
  git checkout $branch

  git checkout master
  git pull
  git checkout $branch
  git merge master
  git push
  git checkout master
  git merge --squash $branch
  git branch -D $branch
  git checkout -b $branch
  git commit
  git diff origin/$branch
  git push -fu origin $branch
}

function cpredo() {
  cp /Users/bryanarendt/code/dynasty-nerds/$1  /Users/bryanarendt/code-dn/dynasty-nerds/$1
}

function docker_container_info() {
  echo "Fetching information for all Docker containers...\n"

  docker ps -a --format "{{.Image}}" | while read -r container_id; do
    echo "Size: $(docker image inspect $container_id --format='{{.Size}}')"
    echo "Name: $container_id"
    echo "\n---\n"
  done
}

function docker_container_info() {
  echo "Fetching information for all Docker containers...\n"
  
  docker_size_human_readable() {
    echo $1 | awk '
      function human(x) {
        s=" B  KB MB GB TB PB EB"
        split(s,v," ")
        x += 0
        for(i=1; x>=1024 && i<8; i++) x/=1024
        return sprintf("%.2f %s", x, v[i])
      }
      {print human($1)}'
  }

  docker ps -a --format "{{.ID}}|{{.Image}}|{{.Names}}" | while IFS='|' read -r container_id image_name container_name; do
    image_size=$(docker image inspect $image_name --format='{{.Size}}')
    human_readable_size=$(docker_size_human_readable $image_size)
    
    echo "Container ID: $container_id"
    echo "Container Name: $container_name"
    echo "Image: $image_name"
    echo "Image Size: $human_readable_size"
    echo "\n---\n"
  done
}

function katop() {
  CLUSTER_NAME=$(kubectl config view --minify -o jsonpath='{.clusters[].name}')
  URL="https://$1.$CLUSTER_NAME.kat.cmmaz.cloud/_ping"
  open $URL
}

function kato() {
  CLUSTER_NAME=$(kubectl config view --minify -o jsonpath='{.clusters[].name}')
  URL="https://$1.$CLUSTER_NAME.kat.cmmaz.cloud/"
  open $URL
}

function katr() {
  CLUSTER_NAME=$(kubectl config view --minify -o jsonpath='{.clusters[].name}')
  URL="https://readme.$CLUSTER_NAME.kat.cmmaz.cloud/"
  open $URL
}

function local-kat() {
  LOCAL_KAT_IMAGE=${LOCAL_KAT_IMAGE:-registry.cmmint.net/platform/local-kat:latest}
  [[ ! -f $HOME/.local-kat-update-check || -n $(find $HOME/.local-kat-update-check \
    -type f -mtime +48h) ]] && \
    docker pull $LOCAL_KAT_IMAGE && touch $HOME/.local-kat-update-check

  docker run --rm -it \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -e KUBECONFIG=/kube/config \
    -v "${HOME}/.kube:/kube" \
    -v "${HOME}/.local-kat:/local-kat" \
    -e CLIENT_HOME="${HOME}" \
    "$LOCAL_KAT_IMAGE" "$@"
}

function kat() {
  IMAGE=${IMAGE:-registry.cmmint.net/platform/kat:latest}
  # Auto-update, but only check once every 48h
  [[ ! -f $HOME/.kat-update-check || $(find $HOME/.kat-update-check -type f -mtime +48h) ]] && docker pull $IMAGE && touch $HOME/.kat-update-check
  docker run -it -e "USER=${USER}" -v "${HOME}/.kube:/kube" $IMAGE "$@"
}

function katfwd() {
  # Check if namespace argument is provided
  if [ $# -ne 1 ]; then
    echo "Usage: port_forward <namespace>"
    return 1
  fi

  # Get pod name from kubectl get pods command
  pod_name=$(kubectl get pods -n "$1" -o jsonpath='{.items[0].metadata.name}')

  # Check if pod name is empty
  if [ -z "$pod_name" ]; then
    echo "No pods found in the specified namespace."
    return 1
  fi

  # Run kubectl port-forward command
  kubectl port-forward -n "$1" "$pod_name" 3314:1433
}

kat-open() {
    # Capture the output of the 'kat list' command
    local output="$(kat list)"

    # Extract the cluster name using awk to parse the specific column
    # assuming the cluster name is always in the first column of the output
    local cluster_name="$(echo "$output" | awk '/^[[:alnum:]]+-[[:alnum:]]+/ {print $1}' | head -1)"

    # If a cluster name was found, open the corresponding URL
    if [[ -n "$cluster_name" ]]; then
        open "https://readme.$cluster_name.kat.cmmaz.cloud"
    else
        echo "Cluster name not found."
    fi
}

k8c() {
  kubectl $@
}

function b() {
    local script_path="$HOME/.zsh/pod-set.sh"  # Adjust this path as needed
    if [[ ! -f "$script_path" ]]; then
        echo "Error: Script not found at $script_path"
        return 1
    fi
    local script_output
    script_output=$("$script_path" git-branch)
    eval "$script_output"
    echo "BRANCH variable set to: $BRANCH"
}

function kill-port() {
  if [ -z "$1" ]; then
    echo "Usage: kill-port <port_number>"
    return 1
  fi
  
  local pids=$(lsof -ti tcp:$1)
  if [ -z "$pids" ]; then
    echo "No process found running on port $1"
    return 1
  fi
  
  # Convert newlines to spaces and count PIDs
  local pid_array=(${(f)pids})
  local count=${#pid_array[@]}
  
  if [ $count -eq 1 ]; then
    echo "Killing process $pids running on port $1"
  else
    echo "Killing $count processes running on port $1: ${pid_array[@]}"
  fi
  
  # Kill each PID separately
  for pid in $pid_array; do
    kill -9 $pid 2>/dev/null
  done
  
  echo "Done"
}

# Zip current directory to clipboard
zipclip() {
    local tempfile=$(mktemp)
    
    if [ -d ".git" ]; then
        # Git repo - use git archive
        git archive --format=zip HEAD | base64 > "$tempfile"
        echo "✓ Archived current directory (git tracked files) to clipboard"
    else
        # Not a git repo - exclude common stuff
        zip -r - . -x "*.git*" "*.DS_Store" "*node_modules*" | base64 > "$tempfile"
        echo "✓ Zipped current directory to clipboard"
    fi
    
    # Get size and copy to clipboard
    local size=$(ls -lh "$tempfile" | awk '{print $5}')
    cat "$tempfile" | pbcopy
    rm "$tempfile"
    
    echo "📋 Clipboard size: $size"
}

# Restore from clipboard to current directory
ziprestore() {
    local tempfile=$(mktemp).zip
    pbpaste | base64 -d > "$tempfile"
    
    # Get size
    local size=$(ls -lh "$tempfile" | awk '{print $5}')
    
    # Extract to current directory
    unzip -o "$tempfile"
    rm "$tempfile"
    
    echo "✓ Restored from clipboard"
    echo "📦 Extracted: $size"
}

# Preview clipboard size (for zipped content)
zippreview() {
    # Check if clipboard contains base64 data
    if ! pbpaste | base64 -d >/dev/null 2>&1; then
        echo "❌ Clipboard doesn't contain valid base64-encoded zip data"
        return 1
    fi
    
    # Get clipboard content size
    local clipboard_size=$(pbpaste | wc -c | awk '{print $1}')
    local human_size=$(echo "$clipboard_size" | awk '
        function human(x) {
            s=" B  KB MB GB"
            split(s,v," ")
            x += 0
            for(i=1; x>=1024 && i<5; i++) x/=1024
            return sprintf("%.2f %s", x, v[i])
        }
        {print human($1)}'
    )
    
    # Try to get uncompressed size
    local tempfile=$(mktemp).zip
    pbpaste | base64 -d > "$tempfile" 2>/dev/null
    
    if [ -f "$tempfile" ]; then
        local zip_size=$(ls -lh "$tempfile" | awk '{print $5}')
        local file_count=$(unzip -l "$tempfile" 2>/dev/null | tail -1 | awk '{print $2}')
        rm "$tempfile"
        
        echo "📋 Clipboard contains zipped data:"
        echo "   Base64 size: $human_size"
        echo "   Zip size: $zip_size"
        if [ ! -z "$file_count" ]; then
            echo "   Files: $file_count"
        fi
    else
        echo "📋 Clipboard size: $human_size (base64)"
    fi
}

# Docker Compose directory navigation
# Usage: cd2dc <container_name>
# Example: cd2dc gm2-test-db
function cd2dc() {
    if [ -z "$1" ]; then
        echo "Usage: cd2dc <container_name>"
        echo "Example: cd2dc gm2-test-db"
        return 1
    fi
    
    local container_name="$1"
    
    # Check if container exists
    if ! docker ps -a --format "{{.Names}}" | grep -q "^${container_name}$"; then
        echo "Error: Container '$container_name' not found"
        echo "Available containers:"
        docker ps -a --format "{{.Names}}" | sort
        return 1
    fi
    
    # Get the docker-compose working directory from container labels
    local compose_dir=$(docker inspect "$container_name" --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' 2>/dev/null)
    
    if [ -z "$compose_dir" ] || [ "$compose_dir" = "<no value>" ]; then
        echo "Error: Container '$container_name' was not created by docker-compose"
        return 1
    fi
    
    if [ ! -d "$compose_dir" ]; then
        echo "Error: Directory '$compose_dir' does not exist"
        return 1
    fi
    
    # Change to the directory
    cd "$compose_dir"
    echo "Changed to docker-compose directory: $PWD"
    
    # Show which compose file was used
    local compose_file=$(docker inspect "$container_name" --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}' 2>/dev/null)
    if [ ! -z "$compose_file" ] && [ "$compose_file" != "<no value>" ]; then
        echo "Compose file: $compose_file"
    fi
}

# Neovim configurations
# bavim - default/minimal nvim config
alias bavim='NVIM_APPNAME=bavim nvim'

source ~/.zsh/local.sh
source ~/.zsh/env.sh
