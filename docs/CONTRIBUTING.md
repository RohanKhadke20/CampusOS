# Contributing to CampusOS

Thank you for contributing to CampusOS! We welcome community participation to enhance the next-generation campus operating system.

---

## Code of Conduct
We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Please be respectful and constructive in all discussions.

---

## Development Workflow

### 1. Fork & Clone
```bash
git clone https://github.com/RohanKhadke20/CampusOS.git
cd CampusOS
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Local Development
```bash
npm run dev
```

### 4. Code Standards & Verification
Every pull request must pass the following checks before being merged:

```bash
# Type check all packages
npm run typecheck

# Lint codebase
npm run lint
```

---

## Commit Guidelines
We follow Conventional Commits:
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `refactor:` Code refactoring without functionality changes
- `test:` Adding or updating tests
- `chore:` Maintenance tasks and build updates
