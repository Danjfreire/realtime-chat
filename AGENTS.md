# AGENTS.md - Developer Guide for realtime-chat

## Project Overview

This is a monorepo using Bun workspaces with two packages:
- **packages/api** - Bun HTTP server (backend)
- **packages/client** - Angular 21 application (frontend)

## Build / Run / Test Commands

### Root Commands
```bash
bun install          # Install all dependencies
bun run dev          # Run dev server for all workspaces
bun run build        # Build all workspaces
```

### API Package (packages/api)
```bash
cd packages/api
bun run dev          # Start development server (runs index.ts)
bun run build        # Build for production
bun index.ts         # Run directly
```

### Client Package (packages/client)
```bash
cd packages/client
bun run dev          # Start Angular dev server (ng serve)
bun run build        # Build for production
bun run start        # Alias for ng serve
bun run watch        # Build with watch mode (development)

# Testing
bun run test         # Run Angular tests (ng test - uses Karma/Jasmine)
bun run test -- --watch     # Watch mode
bun run test -- --browsers ChromeHeadless  # Headless browser
```

### Running a Single Test
```bash
# Angular/Karma (client)
cd packages/client
ng test --include="**/app.spec.ts"     # Run specific test file
ng test --include="**/app.spec.ts" --watch=false  # Single run

# Or via package.json
bun run test -- --include="**/app.spec.ts"
```

### Type Checking
```bash
# Full TypeScript check (from root)
npx tsc --noEmit

# In client package
cd packages/client
npx tsc --noEmit -p tsconfig.app.json
```

## Code Style Guidelines

### TypeScript Configuration
The project uses strict TypeScript with these key settings (tsconfig.json):
- `strict: true` - Enable all strict type checking
- `noUncheckedIndexedAccess: true` - Arrays/tuples have strict index types
- `noImplicitOverride: true` - Must use override keyword when overriding
- `noFallthroughCasesInSwitch: true` - No fallthrough in switch

### Formatting (Prettier)
Client package uses Prettier with these rules (package.json):
```json
{
  "prettier": {
    "printWidth": 100,
    "singleQuote": true
  }
}
```

### Naming Conventions
- **Files**: kebab-case for general files (e.g., `user-service.ts`)
- **Components**: PascalCase (e.g., `UserProfileComponent`)
- **Variables/functions**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE
- **Interfaces**: PascalCase, no "I" prefix (e.g., `User` not `IUser`)

### Imports
- Use explicit imports (no barrel exports unless necessary)
- Group imports: external libraries first, then internal modules
- Use path aliases if configured (check tsconfig.json paths)

### Angular Specific
- Use standalone components (Angular 15+)
- Follow Angular style guide: https://angular.io/guide/styleguide
- Use signals for reactive state where appropriate
- Prefer `OnPush` change detection strategy

### Error Handling
- Use try/catch for async operations
- Return typed error responses from API
- Use proper HTTP status codes
- Log errors appropriately (console.error for server errors)

### General Best Practices
- Enable strict null checks
- Avoid `any` - use `unknown` if type is truly unknown
- Use readonly for immutable arrays/objects
- Prefer const over let for values that don't change

## Project Structure

```
realtime-chat/
├── packages/
│   ├── api/           # Bun server
│   │   └── index.ts   # Entry point
│   └── client/       # Angular app
│       ├── src/
│       │   └── app/   # Angular components
│       ├── angular.json
│       └── package.json
├── package.json       # Root workspace config
├── tsconfig.json     # Base TypeScript config
└── bun.lock          # Bun lockfile
```

## Common Issues & Tips

- If TypeScript errors occur, ensure you're using the correct tsconfig
- For Angular, run `ng version` to check Angular CLI version
- Use `bun` instead of `npm`/`yarn` for faster installs and script execution
- Client uses Tailwind CSS v4 (configured in CSS)
