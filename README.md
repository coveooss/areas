# Areas Action

A GitHub Action to manage code areas ownership and its PR reviews and labeling.

## Inputs

### `token`

**Required** The GitHub Token. Default `"${{ github.token }}"`.

## Example usage

```yaml
uses: coveo/areas@v1
with:
  token: ${{ secrets.GITHUB_TOKEN }}
```

## Development

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Build the action:
   ```bash
   pnpm run build
   ```
3. Test the action:
   ```bash
   pnpm test
   ```
