package com.plans.backend.api.discovery;

import com.plans.backend.api.auth.AuthenticatedUser;
import com.plans.backend.api.error.ApiException;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final DiscoveryQueryService discoveryQueryService;
    private final JdbcClient jdbc;

    public EventController(DiscoveryQueryService discoveryQueryService, JdbcClient jdbc) {
        this.discoveryQueryService = discoveryQueryService;
        this.jdbc = jdbc;
    }

    @GetMapping
    Map<String, Object> events(
        AuthenticatedUser authenticatedUser,
        @RequestParam(required = false) String category,
        @RequestParam(name = "date_from", required = false) String dateFrom,
        @RequestParam(name = "date_to", required = false) String dateTo,
        @RequestParam(defaultValue = "1") String page,
        @RequestParam(defaultValue = "20") String limit
    ) {
        return discoveryQueryService.listEvents(authenticatedUser.id(), category, dateFrom, dateTo, page, limit);
    }

    @GetMapping("/{id}")
    Map<String, Object> event(AuthenticatedUser authenticatedUser, @PathVariable UUID id) {
        return discoveryQueryService.event(authenticatedUser.id(), id);
    }

    @PostMapping("/{id}/interest")
    Map<String, Object> addInterest(AuthenticatedUser authenticatedUser, @PathVariable UUID id) {
        ensureEventExists(id);
        jdbc.sql(
                """
                INSERT INTO event_interests (user_id, event_id)
                VALUES (:userId, :eventId)
                ON CONFLICT (user_id, event_id) DO NOTHING
                """
            )
            .param("userId", authenticatedUser.id())
            .param("eventId", id)
            .update();
        return Map.of();
    }

    @DeleteMapping("/{id}/interest")
    ResponseEntity<Void> removeInterest(AuthenticatedUser authenticatedUser, @PathVariable UUID id) {
        jdbc.sql("DELETE FROM event_interests WHERE user_id = :userId AND event_id = :eventId")
            .param("userId", authenticatedUser.id())
            .param("eventId", id)
            .update();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/save")
    Map<String, Object> saveEvent(AuthenticatedUser authenticatedUser, @PathVariable UUID id) {
        ensureEventExists(id);
        jdbc.sql(
                """
                INSERT INTO saved_events (user_id, event_id)
                VALUES (:userId, :eventId)
                ON CONFLICT (user_id, event_id) DO NOTHING
                """
            )
            .param("userId", authenticatedUser.id())
            .param("eventId", id)
            .update();
        return Map.of();
    }

    @DeleteMapping("/{id}/save")
    ResponseEntity<Void> unsaveEvent(AuthenticatedUser authenticatedUser, @PathVariable UUID id) {
        jdbc.sql("DELETE FROM saved_events WHERE user_id = :userId AND event_id = :eventId")
            .param("userId", authenticatedUser.id())
            .param("eventId", id)
            .update();
        return ResponseEntity.noContent().build();
    }

    private void ensureEventExists(UUID eventId) {
        Integer count = jdbc.sql("SELECT COUNT(*) FROM events WHERE id = :eventId")
            .param("eventId", eventId)
            .query(Integer.class)
            .single();
        if (count == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Event not found");
        }
    }
}
