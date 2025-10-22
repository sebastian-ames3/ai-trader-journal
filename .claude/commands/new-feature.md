# New Feature Workflow

Create a new feature following best practices with proper branch management, testing, and documentation.

Arguments: `$ARGUMENTS` (feature name, e.g., "voice-notes" or "export-csv")

## Workflow Steps

### 1. Feature Planning
- Ask user for clarification if feature requirements are unclear
- Identify which files will be affected
- List main tasks and implementation approach
- Estimate complexity and suggest test strategy

### 2. Create Feature Branch
```bash
git checkout main
git pull
git checkout -b feat/$ARGUMENTS
```

### 3. Create GitHub Issue
- Use `gh` CLI to create tracking issue if one doesn't exist
- Link issue number in commits
- Example: `gh issue create --title "Feature: $ARGUMENTS" --body "Description..."`

### 4. Update CLAUDE.md
- Add feature to "In Progress" section under Implementation Status
- Include issue number and brief description
- Example:
  ```markdown
  **In Progress:**
  - 🚧 Voice Notes & Screenshots (Issue #19)
    - Recording audio journal entries
    - Attaching screenshots to entries
  ```

### 5. Implement with TDD Approach
- **Write tests first** based on requirements
- Confirm tests fail without implementation
- Implement feature to pass tests
- Iterate until all tests pass
- Follow code style guidelines from CLAUDE.md
- Use proper TypeScript types (avoid `any`)
- Add error handling with specific messages

### 6. Run Quality Checks
Execute `/fix-and-test` to ensure:
- ✅ Linting passes
- ✅ Type checking passes
- ✅ All tests pass (including new tests)
- ✅ Build succeeds

### 7. Update Documentation
- Update CLAUDE.md Implementation Status:
  - Move from "In Progress" to "Completed"
  - Add feature details and test coverage info
- Update README.md if user-facing changes
- Add JSDoc comments to new functions
- Update API documentation if endpoints added

### 8. Commit Changes
```bash
git add .
git commit -m "Add $ARGUMENTS feature

Implements [feature description]

- [Key change 1]
- [Key change 2]
- [Key change 3]

Closes #[issue-number]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 9. Push and Create PR
```bash
git push -u origin feat/$ARGUMENTS

gh pr create --title "Feature: $ARGUMENTS" --body "$(cat <<'EOF'
## Summary
[Brief description of the feature]

## Changes
- [Key change 1]
- [Key change 2]
- [Key change 3]

## Testing
- [X] All existing tests pass
- [X] New tests added for feature
- [X] Manual testing completed
- [X] Linting and type checking pass
- [X] Build succeeds

## Screenshots (if UI changes)
[Add screenshots here if applicable]

Closes #[issue-number]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 10. Post-PR Actions
- Provide PR URL to user
- Summarize changes made
- Note any follow-up tasks or considerations

## Best Practices

### Code Quality
- Follow existing patterns in the codebase
- Use TypeScript strict mode features
- Add proper error handling
- Include loading and error states in UI components

### Testing
- Integration tests for API endpoints
- Component tests for UI features
- Test edge cases and error conditions
- Aim for >80% coverage on new code

### Git Hygiene
- Keep commits focused and atomic
- Write descriptive commit messages
- Don't commit secrets or .env files
- Squash commits if needed before merge

### Documentation
- Update CLAUDE.md with architectural changes
- Add inline comments for complex logic
- Document breaking changes clearly
- Update API documentation

## Common Issues

**Branch Already Exists:**
```bash
git branch -d feat/$ARGUMENTS  # Delete local branch
git push origin --delete feat/$ARGUMENTS  # Delete remote branch
```

**Merge Conflicts:**
```bash
git fetch origin main
git rebase origin/main
# Resolve conflicts
git rebase --continue
```

**Failed Tests After Merge:**
- Pull latest main: `git checkout main && git pull`
- Rebase feature branch: `git checkout feat/$ARGUMENTS && git rebase main`
- Re-run tests and fix any issues
