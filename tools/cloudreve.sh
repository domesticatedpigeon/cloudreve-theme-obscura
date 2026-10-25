#!/usr/bin/env bash
set -euo pipefail

dir="${CR_DIR:-$HOME/.cache/obscura-cloudreve}"
port="${CR_PORT:-5212}"
cmd="${1:-start}"

build() {
	mkdir -p "$dir"
	if [ ! -d "$dir/cloudreve" ]; then
		git clone -q --depth 1 --recurse-submodules --shallow-submodules https://github.com/cloudreve/cloudreve.git "$dir/cloudreve"
	fi
	if [ ! -d "$dir/webworkify-webpack" ]; then
		git clone -q https://github.com/xqq/webworkify-webpack.git "$dir/webworkify-webpack"
		git -C "$dir/webworkify-webpack" checkout -q 24d1e719b4a6cac37a518b2bb10fe124527ef4ef
	fi
	version=$(sed -n 's/.*BackendVersion = "\([^"]*\)".*/\1/p' "$dir/cloudreve/application/constants/constants.go")
	cd "$dir/cloudreve/assets"
	node -e 'const f="package.json",fs=require("fs"),p=JSON.parse(fs.readFileSync(f));p.resolutions={...p.resolutions,"webworkify-webpack":"file:"+process.argv[1]};fs.writeFileSync(f,JSON.stringify(p,null,2))' "$dir/webworkify-webpack"
	export NODE_OPTIONS="--max-old-space-size=6144"
	yarn install --network-timeout 1000000
	yarn version --new-version "$version" --no-git-tag-version
	yarn run build
	cd "$dir/cloudreve"
	rm -f application/statics/assets.zip
	zip -qr - assets/build > application/statics/assets.zip
	CGO_ENABLED=0 go build -o "$dir/cloudreve-bin" .
	echo "Built $dir/cloudreve-bin (Cloudreve $version)"
}

case "$cmd" in
	build) build ;;
	start)
		[ -x "$dir/cloudreve-bin" ] || build
		mkdir -p "$dir/data"
		conf="$dir/data/conf.ini"
		if [ -f "$conf" ]; then
			sed -i "s/^Listen *=.*/Listen = :$port/" "$conf"
		else
			secret=$(head -c 96 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 64)
			printf '[System]\nDebug = false\nMode = master\nListen = :%s\nSessionSecret = %s\n' "$port" "$secret" > "$conf"
		fi
		cd "$dir"
		exec "$dir/cloudreve-bin"
		;;
	*) echo "usage: $0 [build|start]" >&2; exit 1 ;;
esac
