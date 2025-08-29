# Unit Testing

Comprehensive guidelines for implementing effective unit testing practices that ensure individual components work correctly in isolation and serve as the foundation of a robust testing strategy.

## Overview

Unit testing is the practice of testing individual components, functions, or modules in isolation from the rest of the system. It forms the foundation of the testing pyramid and provides fast, reliable feedback about code quality and functionality. Well-written unit tests serve as both quality gates and living documentation.

## Unit Testing Principles

### Isolation
- **Test in Isolation** - Each unit test should test only one component
- **Mock Dependencies** - Replace external dependencies with controlled substitutes
- **No External Resources** - Avoid databases, file systems, network calls
- **Independent Execution** - Tests should run independently of each other

### Fast Execution
- **Quick Feedback** - Tests should execute in milliseconds, not seconds
- **Parallel Execution** - Tests should be able to run concurrently
- **No I/O Operations** - Avoid slow operations like file access or network calls
- **In-Memory Testing** - Use in-memory data structures and mocks

### Reliability
- **Deterministic Results** - Same input should always produce same output
- **No Random Data** - Use controlled, predictable test data
- **Idempotent Tests** - Tests can be run multiple times with same results
- **Clear Pass/Fail** - Unambiguous test outcomes

### Maintainability
- **Readable Tests** - Clear, expressive test code that serves as documentation
- **Single Responsibility** - Each test validates one specific behavior
- **Descriptive Naming** - Test names clearly indicate what is being tested
- **Minimal Setup** - Simple test arrangement and initialization

## Testing Patterns and Practices

### Arrange-Act-Assert (AAA) Pattern
```
// Arrange - Set up test data and conditions
const calculator = new Calculator();
const firstNumber = 5;
const secondNumber = 3;

// Act - Execute the unit being tested
const result = calculator.add(firstNumber, secondNumber);

// Assert - Verify the expected outcome
expect(result).toBe(8);
```

### Test-Driven Development (TDD)
1. **Red** - Write a failing test that defines desired functionality
2. **Green** - Write minimal code to make the test pass
3. **Refactor** - Improve code quality while keeping tests green
4. **Repeat** - Continue cycle for each new piece of functionality

### Behavior-Driven Development (BDD)
- **Given-When-Then** - Structure tests around business behavior
- **Readable Specifications** - Tests that business stakeholders can understand
- **Scenario-Based Testing** - Focus on user scenarios and outcomes
- **Living Documentation** - Tests serve as executable specifications

## Testing Framework Selection

### JavaScript/TypeScript
- **Jest** - Full-featured testing framework with built-in mocking
- **Mocha + Chai** - Flexible test runner with assertion library
- **Vitest** - Fast, modern testing framework for Vite projects
- **Jasmine** - Behavior-driven testing framework

### Python
- **pytest** - Powerful, flexible testing framework with fixtures
- **unittest** - Built-in Python testing framework
- **nose2** - Successor to nose with plugin support
- **Hypothesis** - Property-based testing framework

### Java
- **JUnit 5** - Modern Java testing framework with extensions
- **TestNG** - Testing framework with advanced features
- **Mockito** - Mocking framework for Java applications
- **AssertJ** - Fluent assertion library

### C#/.NET
- **xUnit** - Modern, extensible testing framework
- **NUnit** - Mature testing framework with rich feature set
- **MSTest** - Microsoft's testing framework
- **Moq** - Mocking framework for .NET

## Test Coverage and Metrics

### Coverage Types
- **Line Coverage** - Percentage of code lines executed during tests
- **Branch Coverage** - Percentage of code branches (if/else) exercised
- **Function Coverage** - Percentage of functions called during testing
- **Statement Coverage** - Percentage of statements executed

### Coverage Targets
- **Critical Code** - 95%+ coverage for business-critical components
- **Standard Code** - 80%+ coverage for most application code
- **Utility Code** - 70%+ coverage for helper functions and utilities
- **Legacy Code** - Gradual improvement with minimum coverage thresholds

### Quality over Quantity
- **Meaningful Tests** - Focus on testing behavior, not just coverage numbers
- **Edge Case Testing** - Test boundary conditions and error scenarios
- **Business Logic Focus** - Prioritize testing of complex business rules
- **Mutation Testing** - Verify that tests actually catch defects

## Mocking and Test Doubles

### Types of Test Doubles
- **Stubs** - Provide predetermined responses to method calls
- **Mocks** - Verify that specific methods are called with expected parameters
- **Fakes** - Working implementations with simplified behavior
- **Spies** - Record information about method calls for later verification

### Mocking Best Practices
- **Mock External Dependencies** - Replace databases, APIs, file systems
- **Don't Mock Value Objects** - Test simple data structures directly
- **Verify Behavior** - Use mocks to verify important interactions
- **Keep Mocks Simple** - Avoid complex mock setup and verification

### Dependency Injection
- **Constructor Injection** - Provide dependencies through constructor
- **Property Injection** - Set dependencies through public properties
- **Interface Segregation** - Use specific interfaces rather than large ones
- **Factory Patterns** - Use factories for complex object creation

## Common Challenges and Solutions

### Challenge: Testing Private Methods
**Solutions:**
- Focus on testing public interface behavior
- Extract private methods to separate testable classes
- Use reflection sparingly and only when necessary
- Consider if private methods indicate design issues

### Challenge: Testing Static Methods
**Solutions:**
- Wrap static calls in testable interfaces
- Use dependency injection for static dependencies
- Consider using static analysis tools
- Minimize use of static methods in business logic

### Challenge: Testing Async Code
**Solutions:**
- Use framework-specific async testing support
- Properly handle promises and callbacks in tests
- Test both success and error scenarios
- Use appropriate timeout configurations

### Challenge: Flaky Tests
**Solutions:**
- Remove time-dependent assertions
- Use deterministic test data
- Properly isolate tests from each other
- Fix shared state and concurrency issues

## Test Organization and Structure

### File Organization
- **Co-location** - Keep tests near the code they test
- **Mirror Structure** - Test directory structure matches source structure
- **Naming Conventions** - Clear, consistent test file naming
- **Separation of Concerns** - Separate unit, integration, and end-to-end tests

### Test Suites and Categories
- **Test Suites** - Group related tests for easier execution
- **Test Categories** - Tag tests by type (fast, slow, integration)
- **Selective Running** - Run specific test categories based on context
- **Parallel Execution** - Configure tests for concurrent execution

### Test Data Management
- **Test Fixtures** - Reusable test data setup and teardown
- **Factory Pattern** - Programmatic creation of test data
- **Builder Pattern** - Fluent test data construction
- **Data Cleanup** - Proper cleanup after test execution

## Integration with Development Workflow

### Continuous Integration
- **Commit Hooks** - Run fast unit tests before code commits
- **Pull Request Validation** - Full test suite execution on PRs
- **Build Pipeline Integration** - Unit tests as required build steps
- **Failure Notifications** - Immediate feedback on test failures

### Development Process
- **Test-First Development** - Write tests before implementation
- **Refactoring Safety** - Use tests to enable safe code changes
- **Documentation** - Tests serve as executable documentation
- **Code Review** - Include test quality in review process

## Metrics and Monitoring

### Test Quality Metrics
- **Test Coverage Percentage** - Overall and component-specific coverage
- **Test Execution Time** - Speed of test suite execution
- **Test Reliability** - Frequency of flaky or inconsistent tests
- **Defect Detection Rate** - Bugs caught by unit tests vs. later stages

### Development Metrics
- **Test-to-Code Ratio** - Lines of test code vs. production code
- **Time to Green** - Time from red test to passing implementation
- **Refactoring Frequency** - How often code is safely refactored
- **Bug Regression Rate** - Frequency of bugs reoccurring in tested code

---

*Related Topics: [Integration Testing](./integration-testing.md) | [Test Automation](../test-automation.md) | [Code Quality](../code-quality.md)*