# Backend Change: ConnectionService.java

## What
Added the `deleteConnection(UUID connectionId)` method to the `ConnectionService`.

## Why
To support cancelling outgoing pending connection requests and un-friending existing accepted connections. The previous implementation only allowed rejecting incoming requests via `rejectConnectionRequest()`.

## Behavior
The method fetches the connection by ID and performs a zero-trust authorization check. It ensures that the authenticated user is either the `sender` or the `receiver` of the connection. If authorized, it deletes the connection row from the database. This cleanly handles both cancelling a request (as sender) and removing a friend (as either sender or receiver) without cluttering the database.
