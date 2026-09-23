# Backend Change: ConnectionService.java

## What
1. Added the `deleteConnection(UUID connectionId)` method to handle connection cancellation by sender and removal by either party.
2. Updated `rejectConnectionRequest(UUID connectionId)` to delegate to `deleteConnection(connectionId)`.
3. Integrated `connectionRepository.findByIdWithUsers(connectionId)` to eagerly fetch sender and receiver entities.

## Why
1. Senders previously had no way to cancel pending requests.
2. Having `rejectConnectionRequest` delegate to `deleteConnection` allows both `/reject/{connectionId}` and `/{connectionId}` to handle deletion/cancellation cleanly, ensuring full backward and forward compatibility.
3. Using `findByIdWithUsers` avoids lazy-loading exceptions when verifying user permissions on the connection.

## Behavior
Fetches the connection eagerly with its associated sender and receiver. Confirms that the authenticated caller is either the sender or receiver of the connection. If authorized, deletes the connection row from the database.
