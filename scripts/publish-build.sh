#!/usr/bin/env bash
# 把 dist/ 作为一个新 commit 追加到 build 分支（保留历史，不强制覆盖），
# 并给这个 commit 打上 dist-<版本> 标签。
#
# 必需环境变量：
#   RELEASE_TAG   发布的版本标签，例如 v1.0.0
# 可选环境变量：
#   RELEASE_TITLE Release 标题，写入 commit 信息第一行（主题商店把它显示为版本标题）
#   SOURCE_SHA    构建所用的源码 commit
#   REMOTE        远程仓库名，默认 origin
#   BUILD_BRANCH  产物分支名，默认 build
#   DIST_DIR      构建产物目录，默认 dist
set -Eeuo pipefail

RELEASE_TAG=${RELEASE_TAG:?RELEASE_TAG is required}
RELEASE_TITLE=${RELEASE_TITLE:-}
SOURCE_SHA=${SOURCE_SHA:-$(git rev-parse HEAD)}
REMOTE=${REMOTE:-origin}
BUILD_BRANCH=${BUILD_BRANCH:-build}
DIST_DIR=${DIST_DIR:-dist}
DIST_TAG="dist-${RELEASE_TAG}"

if [[ ! -f "$DIST_DIR/index.html" || ! -d "$DIST_DIR/assets" ]]; then
  echo "Error: $DIST_DIR must contain index.html and assets/" >&2
  exit 1
fi

# Worker 与主题商店只接受 [A-Za-z0-9._-] 组成的 ref
if [[ ! "$DIST_TAG" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "Error: tag '$RELEASE_TAG' may only contain letters, digits, '.', '_' and '-'" >&2
  exit 1
fi

DIST_DIR=$(cd "$DIST_DIR" && pwd)
WORK_DIR=$(mktemp -d)
cleanup() {
  git worktree remove --force "$WORK_DIR" >/dev/null 2>&1 || rm -rf "$WORK_DIR"
  git branch -D "publish-build-$$" >/dev/null 2>&1 || true
}
trap cleanup EXIT

if git ls-remote --exit-code --heads "$REMOTE" "$BUILD_BRANCH" >/dev/null 2>&1; then
  git fetch --quiet "$REMOTE" "$BUILD_BRANCH"
  git worktree add --quiet -B "$BUILD_BRANCH" "$WORK_DIR" FETCH_HEAD
else
  git worktree add --quiet --detach "$WORK_DIR"
  # 本地用临时分支名，推送时写入远程的 $BUILD_BRANCH
  git -C "$WORK_DIR" checkout --quiet --orphan "publish-build-$$"
  git -C "$WORK_DIR" rm -rf --quiet . >/dev/null 2>&1 || true
fi

# 用本次产物替换分支内容
find "$WORK_DIR" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -a "$DIST_DIR"/. "$WORK_DIR"/

git -C "$WORK_DIR" add -A
if git -C "$WORK_DIR" diff --cached --quiet && git -C "$WORK_DIR" rev-parse --verify --quiet HEAD >/dev/null; then
  echo "Build output is identical to the current $BUILD_BRANCH branch; tagging the existing commit."
else
  subject="$RELEASE_TAG"
  if [[ -n "$RELEASE_TITLE" && "$RELEASE_TITLE" != "$RELEASE_TAG" ]]; then
    subject="$RELEASE_TAG $RELEASE_TITLE"
  fi
  # 主题商店只显示第一行，去掉换行
  subject=$(printf '%s' "$subject" | tr '\r\n' '  ')
  git -C "$WORK_DIR" commit --quiet -m "$subject" -m "Source: ${SOURCE_SHA}"
  git -C "$WORK_DIR" push --quiet "$REMOTE" "HEAD:refs/heads/${BUILD_BRANCH}"
fi

BUILD_SHA=$(git -C "$WORK_DIR" rev-parse HEAD)
git tag -f "$DIST_TAG" "$BUILD_SHA" >/dev/null
git push --quiet --force "$REMOTE" "refs/tags/${DIST_TAG}"

echo "Published $RELEASE_TAG -> $BUILD_BRANCH@$BUILD_SHA (tag $DIST_TAG)"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "build_sha=$BUILD_SHA"
    echo "dist_tag=$DIST_TAG"
  } >>"$GITHUB_OUTPUT"
fi
