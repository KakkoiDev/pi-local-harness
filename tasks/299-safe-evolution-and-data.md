# 299: Safe evolution of existing apps and their data

Kind: code

GPT-Sol's further proposals: a second or tenth change must keep earlier behaviour and the person's custom work; data must
stay usable through change (migrations, backup and restore, import and export), code rollback separate from data restore.

- [ ] Versioned blocks with update boundaries and upgrade tests (with plan 266's blocks).
- [ ] Migrations tested against realistic sample data; backup/restore and export/import in the starters, tested.
- [ ] Undo explains that rolling back code does not restore data.

## Scenarios

### US-new Undo says that rolling back the code does not restore the app's data
Given a project whose app keeps data and a request that changed its code
When I choose Undo on that request
Then the confirmation says the code goes back but the app's data stays as it is now
