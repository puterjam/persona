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
    chmod +x "$tmp_dir/persona"

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

    cp "$tmp_dir/persona" "$INSTALL_DIR/persona"
    rm -rf "$tmp_dir"

    echo "Installed persona to $INSTALL_DIR/persona"

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
