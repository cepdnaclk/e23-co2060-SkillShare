# Backend Change: ConnectionRepository.java

## What
Added the `findByIdWithUsers(UUID connectionId)` query method with `JOIN FETCH c.sender` and `JOIN FETCH c.receiver`.

## Why
When deleting or cancelling a connection request, the system verifies the identity of the sender and receiver against the authenticated user. Because `sender` and `receiver` are marked with `FetchType.LAZY`, accessing them on an entity fetched via standard `findById` could cause lazy-loading proxy resolution errors. `findByIdWithUsers` eagerly fetches both user records in a single query.

## Behavior
Executes a single SQL query joining `connections` with `users` for both the sender and receiver. If found, returns the `Connection` entity with fully populated `User` objects, preventing any `LazyInitializationException` or uninitialized proxy issues during authorization checks.
