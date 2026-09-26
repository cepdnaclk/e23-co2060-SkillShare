package com.zenware.skillsharebackend.persistence;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

/** UTC storage in the existing chat timestamp-without-time-zone column.
 * Legacy rows are interpreted as UTC, matching the reported production timestamps.
 * Deliberately not auto-applied: other application timestamps are unaffected.
 */
@Converter
public class ChatTimestampConverter implements AttributeConverter<Instant, LocalDateTime> {
    @Override
    public LocalDateTime convertToDatabaseColumn(Instant value) {
        return value == null ? null : LocalDateTime.ofInstant(value, ZoneOffset.UTC);
    }

    @Override
    public Instant convertToEntityAttribute(LocalDateTime value) {
        return value == null ? null : value.toInstant(ZoneOffset.UTC);
    }
}
