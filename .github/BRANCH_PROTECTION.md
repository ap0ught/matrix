# Branch Protection Configuration Guide

This document outlines the recommended branch protection settings for the Matrix repository to ensure code quality and prevent accidental damage to the main codebase.

## 🛡️ Recommended Branch Protection Rules

### For `master` branch:

#### Required Status Checks
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- Required checks:
  - `validate-matrix` (from Master Branch Protection workflow)
  - `security-scan` (from Master Branch Protection workflow)

#### Restrictions
- ✅ **Restrict pushes that create files larger than 100 MB**
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: **1**
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from CODEOWNERS
- ✅ **Restrict force pushes**
- ✅ **Restrict deletions**

#### Additional Settings
- ✅ **Do not allow bypassing the above settings**
- ✅ **Include administrators** (enforce rules for repository administrators)

## 🔧 How to Configure Branch Protection

### Via GitHub Web Interface:

1. Navigate to your repository on GitHub
2. Click **Settings** tab
3. Click **Branches** in the left sidebar
4. Click **Add rule** or edit existing rule for `master`
5. Configure the settings as outlined above

### Via GitHub CLI:

```bash
# Enable branch protection with required status checks
gh api repos/:owner/:repo/branches/master/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["validate-matrix","security-scan"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

### Via GitHub API:

```bash
curl -X PUT \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/branches/master/protection \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": ["validate-matrix", "security-scan"]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "required_approving_review_count": 1,
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": true
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false
  }'
```

## 🚀 What These Protections Provide

### Force Push Protection
- Prevents rewriting commit history on master branch
- Maintains integrity of the project's git history
- Protects against accidental data loss

### Deletion Protection  
- Prevents accidental deletion of the master branch
- Ensures the main codebase always remains available

### Required Status Checks
- **Code Formatting**: Ensures all code follows project formatting standards
- **Application Validation**: Verifies the Matrix application loads and functions correctly
- **Security Scanning**: Checks for vulnerabilities in dependencies and code
- **JavaScript Validation**: Ensures all modules are syntactically correct
- **HTML Structure**: Validates core HTML elements are present

### Required Reviews
- **CODEOWNERS Review**: Ensures the repository maintainer reviews all changes
- **Pull Request Requirement**: Prevents direct pushes to master
- **Approval Requirement**: Requires at least one approval before merging

## 🧠 Implementation Details

### Automated Protections (Already Implemented)
- **CODEOWNERS file**: Automatically requests review from `@ap0ught` for all changes
- **GitHub Actions workflow**: Runs validation checks on every pull request
- **Status checks**: Provides required passing checks before merge

### Manual Configuration Required
The following must be configured through GitHub repository settings:
- Enable branch protection rule for `master` branch
- Configure required status checks to include workflow jobs
- Enable force push and deletion restrictions
- Set up required pull request reviews

## 🕶️ Matrix Reference

*"There is no spoon"* - The protection isn't just in the code, it's in the configuration.

Just as Neo learned that the Matrix's rules could be bent when you understand them, these branch protection rules can be configured to bend reality in favor of code quality and safety. The key is knowing which rules to apply and when.

*"What is real? How do you define 'real'?"* - Morpheus

These protections define what's "real" in our repository - ensuring only validated, reviewed code becomes part of the master timeline.

## 🔍 Verification

To verify branch protection is working:

1. Try to push directly to master (should be blocked)
2. Try to force push to master (should be blocked)  
3. Try to delete master branch (should be blocked)
4. Create a PR without required checks passing (should be blocked from merging)
5. Create a PR without review approval (should be blocked from merging)

## 📞 Support

If you encounter issues with branch protection settings, please:
1. Check that you have the required permissions
2. Verify the GitHub Actions workflow is running successfully
3. Ensure CODEOWNERS file is properly configured
4. Contact the repository administrator for assistance