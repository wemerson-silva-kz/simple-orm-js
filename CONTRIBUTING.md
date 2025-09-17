# Contributing to Simple ORM JS

Thank you for your interest in contributing to Simple ORM JS! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- Bun (for testing)
- Apache Cassandra or ScyllaDB running locally
- Git

### Setup Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/simple-orm-js.git
   cd simple-orm-js
   ```

3. Install dependencies:
   ```bash
   bun install
   ```

4. Start Cassandra/ScyllaDB locally:
   ```bash
   # Using Docker
   docker run --name cassandra -p 9042:9042 -d cassandra:latest
   ```

5. Run tests to ensure everything works:
   ```bash
   bun test
   ```

6. Build the project:
   ```bash
   bun run build
   ```

## 🛠️ Development Workflow

### Project Structure
```
src/
├── client.ts          # Main ORM client
├── converter.ts       # Type conversion utilities
├── validator.ts       # Validation system
├── types.ts          # TypeScript type definitions
└── index.ts          # Main exports

test/
├── core.test.ts           # Core functionality tests
├── enhanced.test.ts       # Enhanced features tests
├── all-types.test.ts      # All types support tests
└── unique-constraints.test.ts # Unique constraints tests

docs/
└── API.md            # API documentation
```

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the coding standards

3. Add tests for new functionality

4. Run tests to ensure nothing breaks:
   ```bash
   bun test
   ```

5. Build and check TypeScript compilation:
   ```bash
   bun run build
   ```

6. Commit your changes:
   ```bash
   git commit -m "feat: add your feature description"
   ```

7. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

8. Create a Pull Request

## 📝 Coding Standards

### TypeScript
- Use TypeScript for all code
- Maintain strict type checking
- Use meaningful type names
- Document complex types

### Code Style
- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Use meaningful variable and function names
- Keep functions small and focused

### Comments
- Document public APIs with JSDoc
- Add comments for complex logic
- Keep comments up to date

### Example:
```typescript
/**
 * Converts a value to the appropriate Cassandra type
 * @param value - The value to convert
 * @param type - The target Cassandra type
 * @returns The converted value
 */
static convert(value: any, type: CassandraType): any {
  const converter = this.converters.get(type);
  return converter ? converter(value) : value;
}
```

## 🧪 Testing

### Test Structure
- Unit tests for individual functions
- Integration tests for complete workflows
- Type tests for TypeScript definitions

### Writing Tests
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';

describe('Feature Name', () => {
  beforeAll(async () => {
    // Setup
  });

  afterAll(async () => {
    // Cleanup
  });

  it('should do something specific', async () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

### Running Tests
```bash
# Run all tests
bun test

# Run specific test file
bun test test/core.test.ts

# Run tests with coverage
bun test --coverage
```

## 📚 Documentation

### API Documentation
- Update `docs/API.md` for API changes
- Include examples for new features
- Document breaking changes

### README Updates
- Update feature lists
- Add new examples
- Update version numbers

### Code Documentation
- Use JSDoc for public APIs
- Document complex algorithms
- Include usage examples

## 🐛 Bug Reports

### Before Reporting
1. Check existing issues
2. Ensure you're using the latest version
3. Test with minimal reproduction case

### Bug Report Template
```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**
1. Step one
2. Step two
3. Step three

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- Simple ORM JS version:
- Node.js version:
- Cassandra/ScyllaDB version:
- Operating System:

**Additional Context**
Any other relevant information
```

## 💡 Feature Requests

### Before Requesting
1. Check existing issues and discussions
2. Consider if it fits the project scope
3. Think about implementation complexity

### Feature Request Template
```markdown
**Feature Description**
Clear description of the proposed feature

**Use Case**
Why is this feature needed?

**Proposed Implementation**
How should this be implemented?

**Alternatives Considered**
What other approaches were considered?

**Additional Context**
Any other relevant information
```

## 🔄 Pull Request Process

### Before Submitting
1. Ensure all tests pass
2. Update documentation
3. Add tests for new features
4. Follow coding standards
5. Rebase on latest main branch

### Pull Request Template
```markdown
**Description**
Brief description of changes

**Type of Change**
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

**Testing**
- [ ] Tests pass locally
- [ ] New tests added
- [ ] Manual testing completed

**Documentation**
- [ ] API documentation updated
- [ ] README updated if needed
- [ ] CHANGELOG updated

**Checklist**
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] No new warnings introduced
```

### Review Process
1. Automated tests must pass
2. Code review by maintainers
3. Documentation review
4. Final approval and merge

## 🏷️ Versioning

We use [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🤝 Code of Conduct

### Our Pledge
We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards
- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Enforcement
Instances of unacceptable behavior may be reported to the project maintainers.

## 📞 Getting Help

- 📖 Check the [documentation](./docs/API.md)
- 🐛 Search [existing issues](https://github.com/wemerson-silva-kz/simple-orm-js/issues)
- 💬 Start a [discussion](https://github.com/wemerson-silva-kz/simple-orm-js/discussions)
- 📧 Contact maintainers

Thank you for contributing to Simple ORM JS! 🚀
