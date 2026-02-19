#!/bin/bash

set -e

REPO="puterjam/persona"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"
FORCE=false

usage() {
    cat <<EOF
Usage: curl -sSfL https://raw.githubusercontent.com/puterjam/persona/refs/heads/dev/install.sh | [sudo] bash [-s -- [-f] [-d DIR] [version]]

Options:
    -f, --force      Force reinstall even if already installed
    -d, --dir DIR    Install to custom directory (default: $INSTALL_DIR)
    version          Specific version to install (default: latest)

Examples:
    curl -sSfL https://raw.githubusercontent.com/puterjam/persona/refs/heads/dev/install.sh | bash
    curl -sSfL https://raw.githubusercontent.com/puterjam/persona/refs/heads/dev/install.sh | sudo bash
    curl -sSfL https://raw.githubusercontent.com/puterjam/persona/refs/heads/dev/install.sh | bash -s -- -d /usr/local/bin
EOF
    exit 0
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--force)
                FORCE=true
                shift
                ;;
            -d|--dir)
                INSTALL_DIR="$2"
                shift 2
                ;;
            -h|--help)
                usage
                ;;
            -s|--)
                shift
                ;;
            *)
                VERSION="$1"
                shift
                ;;
        esac
    done
}

detect_os() {
    case "$(uname -s)" in
        Linux*)     OS="linux";;
        Darwin*)    OS="darwin";;
        *)          echo "Unsupported OS: $(uname -s)"; exit 1;;
    esac
}

detect_arch() {
    case "$(uname -m)" in
        x86_64)     ARCH="x64";;
        aarch64|arm64)  ARCH="arm64";;
        *)          echo "Unsupported architecture: $(uname -m)"; exit 1;;
    esac
}

get_version() {
    if [[ -n "$VERSION" ]]; then
        echo "$VERSION"
    else
        curl -sSL "https://api.github.com/repos/$REPO/releases/latest" | grep -o '"tag_name":.*' | cut -d'"' -f4 | sed 's/^v//'
    fi
}

get_download_url() {
    local version="$1"
    echo "https://github.com/$REPO/releases/download/v${version}/persona-${version}-bun-${OS}-${ARCH}.zip"
}

sync_assets() {
    local themes_dir="$HOME/.persona/themes"
    local templates_dir="$HOME/.persona/templates"

    echo "Syncing themes and templates..."

    mkdir -p "$themes_dir"
    for theme in persona gruvbox dracula nord; do
        curl -fsSL "https://raw.githubusercontent.com/$REPO/refs/heads/dev/themes/${theme}.json" -o "$themes_dir/${theme}.json" || true
    done
    echo "Synced themes to $themes_dir"

    mkdir -p "$templates_dir"
    local categories=$(curl -fsSL "https://api.github.com/repos/$REPO/contents/templates" | grep '"name"' | grep -o '/templates/[^"]*' | cut -d'/' -f3 | sort -u || echo "claude")
    
    for cat in $categories; do
        local cat_dir="$templates_dir/$cat"
        mkdir -p "$cat_dir"
        local files=$(curl -fsSL "https://api.github.com/repos/$REPO/contents/templates/$cat" 2>/dev/null | grep '"name"' | grep -o '"[^"]*\.json"' | tr -d '"' || true)
        for file in $files; do
            curl -fsSL "https://raw.githubusercontent.com/$REPO/refs/heads/dev/templates/$cat/$file" -o "$cat_dir/$file" 2>/dev/null || true
        done
    done
    
    if [[ -d "$templates_dir/claude" ]]; then
        echo "Synced templates to $templates_dir"
    fi
}

install() {
    local version="$1"
    local download_url="$2"
    local tmp_dir
    tmp_dir=$(mktemp -d)

    echo "Installing persona v${version} for ${OS}-${ARCH}..."

    mkdir -p "$INSTALL_DIR"

    local zip_path="$tmp_dir/persona.zip"
    curl -fSL "$download_url" -o "$zip_path"
    unzip -o "$zip_path" -d "$tmp_dir"
    local binary_path
    binary_path=$(ls "$tmp_dir"/persona-*-bun-${OS}-${ARCH})
    chmod +x "$binary_path"

    if [[ "$INSTALL_DIR" == /usr/local/bin/* ]] && [[ -z "$SUDO_USER" ]]; then
        echo "Error: Installing to $INSTALL_DIR requires sudo"
        rm -rf "$tmp_dir"
        exit 1
    fi

    if [[ -f "$INSTALL_DIR/persona" ]] && [[ "$FORCE" != "true" ]]; then
        echo "persona is already installed at $INSTALL_DIR/persona"
        echo "Use -f to force reinstall"
        rm -rf "$tmp_dir"
        exit 0
    fi

    cp "$binary_path" "$INSTALL_DIR/persona"

    sync_assets

    echo "Installed persona to $INSTALL_DIR/persona"
    echo ""
    echo "Run 'persona sync' to download the latest templates and themes"

    if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
        echo ""
        echo "Warning: $INSTALL_DIR is not in your PATH"
        echo "Add the following to your shell profile:"
        echo "  export PATH=\"\$PATH:$INSTALL_DIR\""
    fi
}

main() {
    parse_args "$@"
    detect_os
    detect_arch

    local version
    version=$(get_version)
    local download_url
    download_url=$(get_download_url "$version")

    install "$version" "$download_url"
}

main "$@"
