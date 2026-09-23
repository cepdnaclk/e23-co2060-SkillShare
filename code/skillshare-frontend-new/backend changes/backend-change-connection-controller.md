# Backend Change: ConnectionController.java

## What
Added a new DELETE endpoint (`/{connectionId}`) to the `ConnectionController`.

## Why
To support the frontend requirement of allowing users to cancel outgoing connection requests, as well as allowing users to remove accepted friends. Previously, there was only an endpoint to reject incoming requests, but no way for a sender to cancel a pending request or for a user to remove an existing connection.

## Behavior
When a `DELETE` request is sent to `/api/connections/{connectionId}`, the controller delegates to `connectionService.deleteConnection(connectionId)`, which handles both cancelling a pending request and un-friending an accepted connection securely.
