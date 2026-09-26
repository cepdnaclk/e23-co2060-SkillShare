package com.zenware.skillsharebackend.controller;

import org.springframework.test.context.ActiveProfiles;

/** Runs the chat REST/persistence regressions against a disposable PostgreSQL database.
 * The local-it profile uses TEST_DB_URL, TEST_DB_USERNAME and TEST_DB_PASSWORD.
 */
@ActiveProfiles(value = "local-it", inheritProfiles = false)
class PostgresChatTimestampIT extends ChatRestControllerTest {
}
