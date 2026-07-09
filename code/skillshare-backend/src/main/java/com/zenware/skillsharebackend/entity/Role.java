package com.zenware.skillsharebackend.entity;

/**
 * LOGIC: Tells Spring Security what permissions a user has.
 * Right now, everyone gets "USER", but later you can add "ADMIN"
 * to lock down specific admin-only dashboard endpoints!
 */
public enum Role {
    USER,
    ADMIN
}