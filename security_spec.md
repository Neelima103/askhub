# Security Specification for AskHub

## Data Invariants
1. A user profile's role cannot be changed by the user themselves once created (prevents privilege escalation).
2. Materials can only be uploaded by users with the 'faculty' or 'admin' role.
3. Students can only read materials that have been 'validated'.
4. Chats are private to the student who started them.
5. Faculty can only edit or delete materials they uploaded.

## The Dirty Dozen Payloads (Attack Vectors)
1. **Self-Promotion**: Student trying to set `role: "admin"` during registration.
2. **Shadow Update**: Faculty trying to change `facultyId` on a material to someone else.
3. **Ghost Write**: Student trying to upload a research paper.
4. **Leakage**: Student trying to read a 'pending' material.
5. **Spoofing**: User A trying to write to User B's chat history.
6. **Poisoning**: Injecting 2MB string into `title` field.
7. **Identity Theft**: User trying to change their own `uid` in the profile.
8. **Bypass Validation**: Faculty updating a validated material but skipping the `status: pending` reset (if required by logic, though here they can validate).
9. **Relational Break**: Creating a chat for a material that doesn't exist.
10. **Admin Escalation**: Student trying to access the `/users` collection list query.
11. **PII Leak**: Student trying to fetch User B's private email.
12. **Orphan Write**: Writing a message to a chat that belongs to another user.

## Implementation Details
- `isValidUser`: Checks keys, role enum, and auth match.
- `isValidMaterial`: Checks keys, status enum, and faculty role via `get()`.
- `isValidMessage`: Checks role enum and server timestamp.
