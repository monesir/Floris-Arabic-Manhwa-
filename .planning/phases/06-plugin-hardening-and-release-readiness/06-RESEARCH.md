# Phase 6 Research

## Current Codebase Constraints

- external plugin discovery is synchronous manifest parsing only
- active source catalog resolution still reads from built-in runtime sources only
- plugin registry persistence stores only `status` and `failure_reason`, not compatibility or entry-file details
- the desktop package has no packaging dependency or distribution script yet

## Runtime Direction

- keep renderer privileges unchanged and continue exposing plugin state only through preload/IPC
- treat external plugin code as a source-handler module declared by manifest metadata
- validate that an external entry file resolves inside the plugin root before import
- mark incompatible or partially loadable plugins explicitly instead of silently treating them as disabled

## Release Direction

- add `electron-builder` to the desktop workspace
- provide both an unpacked Windows directory build for verification and an installer-oriented build path for distribution
- keep output under a predictable `release/` directory inside `apps/desktop`
