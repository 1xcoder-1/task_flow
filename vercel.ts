export const config = {
  ignoreCommand:
    "git diff HEAD^ HEAD --name-only | grep -qEv '(\.md$|LICENSE$|\.env\.example$|^\.github/|^\.vscode/)' && exit 1 || exit 0",
  trailingSlash: false,
};
