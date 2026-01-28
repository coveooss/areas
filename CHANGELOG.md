# areas

## 0.1.0

### Minor Changes

- a81e55b: Add support for multiple bypass actor types in `review_bypass` configuration.

  - Support `team/`, `role/`, and `integration/` prefixes for bypass actors
  - Default to team when no prefix is provided (e.g., `docs-admins` is equivalent to `team/docs-admins`)

### Patch Changes

- 2d38015: Update @github/actions from v7 to v8

## 0.0.1

### Patch Changes

- 1dcde10: Initial release
