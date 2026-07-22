# Git Commit Rule

## Do Not Add Co-Author Attribution

When creating commits or suggesting commit commands, **never** add a `Co-Authored-By:` trailer to the commit message.

### Requirements

- Do **not** include:

  ```
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

  or any other `Co-Authored-By:` entry.

- Generate commit messages containing **only** the commit title and, if appropriate, a descriptive body.

- Do not modify Git configuration to enable co-author attribution.

- If an environment, hook, or tool automatically appends `Co-Authored-By:`, remove it before finalizing the commit.

### Example

**Correct**

```text
feat(auth): add email verification flow

- Add verification endpoint
- Send verification email after registration
- Handle expired verification links
```

**Incorrect**

```text
feat(auth): add email verification flow

- Add verification endpoint
- Send verification email after registration

Co-Authored-By: Claude <noreply@anthropic.com>
```

This rule applies to **all repositories** and **all commits** unless explicitly instructed otherwise by the user.
