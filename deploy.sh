!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

# 生成静态文件
npm run build

# 进入生成的文件夹
cd ./public

git init
git add -A
git commit -m "$1"


# 把下面的push命令按照你的情况修改后去掉注释
git push -f https://github.com/echoLC/echolc.github.com.git master