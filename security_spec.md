# Security Specification & Test Plan

## 1. Data Invariants
- Each user can only read and write their own `/users/{userId}` profile document.
- Only authenticated users with matching `request.auth.uid == userId` or `isAdmin()` can read/write partner profile records.
- System admins are stored under `/admins/{adminId}` where `request.auth.uid == adminId`.
- Unauthenticated write operations are strictly rejected by the default-deny global barrier.
- Timestamps and IDs must be validated and bounded in length.

## 2. The Dirty Dozen Payloads (Rejection Targets)
1. **Unauthenticated Read on Users**: Read attempt on `/users/victim_123` with `request.auth == null` -> DENIED.
2. **Unauthenticated Write on Users**: Write attempt on `/users/victim_123` with `request.auth == null` -> DENIED.
3. **Impersonated User Write**: User `attacker_456` attempts to overwrite `/users/victim_123` -> DENIED.
4. **Self-Escalation to Admin**: User attempts to set `role: "admin"` inside `/users/{userId}` -> DENIED.
5. **Unauthorized Admin Collection Creation**: Non-admin attempts to create a document in `/admins/{attacker_uid}` -> DENIED.
6. **Partner Profile Stealing**: Attacker attempts to update `/partners/legit_partner` -> DENIED.
7. **Oversized String Injection**: Payload containing a 2MB string in `displayName` -> DENIED.
8. **Document ID Poisoning**: Document ID with path traversal or malicious characters `../../../etc/passwd` -> DENIED.
9. **Blanket Query Scraping**: List query on `/users` without scoping to current user UID -> DENIED.
10. **Ghost Fields Update**: Sending unexpected arbitrary keys (`hacked: true`) during profile update -> DENIED.
11. **Negative Wallet Balance Injection**: Setting `wallet_balance: -999999` directly via client write -> DENIED.
12. **Immutable Field Tampering**: Attempting to alter `uid` or `createdAt` on an existing user document -> DENIED.

## 3. Test Runner Specification
Tests verify:
- Default deny catch-all `/{document=**}` denies all non-whitelisted access.
- `users/{userId}` rules allow owner access only.
- `partners/{partnerId}` rules enforce identity matching.
