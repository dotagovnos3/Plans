package com.plans.backend.api.smoke;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.plans.backend.content.ContentOpsService;
import com.plans.backend.persistence.DevSeedRunner;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
        "JWT_SECRET=dev-secret",
        "OTP_CODE=1111",
    }
)
@Testcontainers
class FullSpringSmokeIntegrationTest {
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17");

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final HttpClient HTTP = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5))
        .build();

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("DATABASE_URL", POSTGRES::getJdbcUrl);
        registry.add("DATABASE_USERNAME", POSTGRES::getUsername);
        registry.add("DATABASE_PASSWORD", POSTGRES::getPassword);
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
    }

    @Autowired
    private DevSeedRunner devSeedRunner;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private ContentOpsService contentOpsService;

    @LocalServerPort
    private int port;

    @BeforeEach
    void seed() {
        devSeedRunner.run();
    }

    @Test
    void fullSpringSmokeCoversRealHttpWebSocketAndContentOpsServicePath() throws Exception {
        JsonNode health = request("GET", "/api/health", null, null, HttpStatus.OK);
        assertThat(health.at("/status").asText()).isEqualTo("ok");

        Login creator = login("+79990000000");
        Login participant = login("+79991111111");
        Login joiner = login("+79994444444");
        Login invited = login("+79992222222");

        JsonNode events = request("GET", "/api/events", creator.token(), null, HttpStatus.OK);
        assertThat(events.at("/events").size()).isGreaterThanOrEqualTo(1);
        assertThat(events.at("/events/0/venue").isMissingNode()).isFalse();

        TestWs participantWs = connect(participant.token());
        TestWs invitedWs = connect(invited.token());
        try {
            JsonNode createdPlan = request(
                "POST",
                "/api/plans",
                creator.token(),
                Map.of(
                    "title", "Full Spring smoke",
                    "activity_type", "coffee",
                    "participant_ids", List.of(participant.userId())
                ),
                HttpStatus.CREATED
            ).at("/plan");
            String planId = createdPlan.at("/id").asText();
            String shareToken = createdPlan.at("/share_token").asText();
            assertThat(createdPlan.at("/lifecycle_state").asText()).isEqualTo("active");
            assertThat(createdPlan.at("/participants").size()).isEqualTo(2);

            participantWs.subscribe("plan:" + planId);
            invitedWs.subscribe("user:" + invited.userId());

            JsonNode list = request("GET", "/api/plans?participant=me", creator.token(), null, HttpStatus.OK);
            assertThat(hasId(list.at("/plans"), planId)).isTrue();

            JsonNode detail = request("GET", "/api/plans/" + planId, creator.token(), null, HttpStatus.OK);
            assertThat(detail.at("/plan/id").asText()).isEqualTo(planId);

            JsonNode preview = request("GET", "/api/plans/by-token/" + shareToken, null, null, HttpStatus.OK);
            assertThat(preview.at("/plan/id").asText()).isEqualTo(planId);
            assertThat(preview.at("/plan/participant_count").asInt()).isEqualTo(2);

            JsonNode join = request("POST", "/api/plans/by-token/" + shareToken + "/join", joiner.token(), null, HttpStatus.OK);
            assertThat(join.at("/already_joined").asBoolean()).isFalse();
            assertThat(participantStatus(join.at("/plan/participants"), joiner.userId())).isEqualTo("going");
            assertThat(participantWs.waitForEvent("plan.participant.added").at("/payload/participant/user_id").asText())
                .isEqualTo(joiner.userId());

            JsonNode invitedParticipant = request(
                "POST",
                "/api/plans/" + planId + "/participants",
                creator.token(),
                Map.of("user_id", invited.userId()),
                HttpStatus.OK
            );
            assertThat(invitedParticipant.at("/participant/status").asText()).isEqualTo("invited");
            assertThat(participantWs.waitForEvent("plan.participant.added").at("/payload/participant/user_id").asText())
                .isEqualTo(invited.userId());
            JsonNode inviteNotification = invitedWs.waitForEvent("notification.created");
            assertThat(inviteNotification.at("/payload/type").asText()).isEqualTo("plan_invite");

            JsonNode participants = request("GET", "/api/plans/" + planId + "/participants", creator.token(), null, HttpStatus.OK);
            assertThat(participants.at("/participants").size()).isEqualTo(4);

            String placeProposalId = createPlaceProposal(creator.token(), planId, "Full smoke cafe");
            JsonNode placeProposalEvent = participantWs.waitForEvent("plan.proposal.created");
            assertThat(placeProposalEvent.at("/payload/id").asText()).isEqualTo(placeProposalId);

            String timeProposalId = createTimeProposal(creator.token(), planId);
            participantWs.waitForEvent("plan.proposal.created");

            JsonNode proposals = request("GET", "/api/plans/" + planId + "/proposals", participant.token(), null, HttpStatus.OK);
            assertThat(proposals.at("/proposals").size()).isEqualTo(2);

            JsonNode vote = request(
                "POST",
                "/api/plans/" + planId + "/proposals/" + placeProposalId + "/vote",
                participant.token(),
                null,
                HttpStatus.OK
            );
            assertThat(vote.at("/vote/proposal_id").asText()).isEqualTo(placeProposalId);
            JsonNode voteAdded = participantWs.waitForEvent("plan.vote.changed");
            assertThat(voteAdded.at("/payload/action").asText()).isEqualTo("added");

            request(
                "DELETE",
                "/api/plans/" + planId + "/proposals/" + placeProposalId + "/vote",
                participant.token(),
                null,
                HttpStatus.NO_CONTENT
            );
            JsonNode voteRemoved = participantWs.waitForEvent("plan.vote.changed");
            assertThat(voteRemoved.at("/payload/action").asText()).isEqualTo("removed");

            JsonNode finalized = request(
                "POST",
                "/api/plans/" + planId + "/finalize",
                creator.token(),
                Map.of("place_proposal_id", placeProposalId, "time_proposal_id", timeProposalId),
                HttpStatus.OK
            );
            assertThat(finalized.at("/plan/lifecycle_state").asText()).isEqualTo("finalized");
            assertThat(participantWs.waitForEvent("plan.finalized").at("/payload/plan_id").asText()).isEqualTo(planId);

            JsonNode unfinalized = request("POST", "/api/plans/" + planId + "/unfinalize", creator.token(), null, HttpStatus.OK);
            assertThat(unfinalized.at("/plan/lifecycle_state").asText()).isEqualTo("active");
            assertThat(participantWs.waitForEvent("plan.unfinalized").at("/payload/plan_id").asText()).isEqualTo(planId);

            JsonNode message = request(
                "POST",
                "/api/plans/" + planId + "/messages",
                participant.token(),
                Map.of("text", "full smoke hello", "client_message_id", "full-smoke-dedup-1"),
                HttpStatus.CREATED
            );
            String messageId = message.at("/message/id").asText();
            assertThat(participantWs.waitForEvent("plan.message.created").at("/payload/id").asText()).isEqualTo(messageId);

            JsonNode duplicateMessage = request(
                "POST",
                "/api/plans/" + planId + "/messages",
                participant.token(),
                Map.of("text", "duplicate text ignored", "client_message_id", "full-smoke-dedup-1"),
                HttpStatus.CREATED
            );
            assertThat(duplicateMessage.at("/message/id").asText()).isEqualTo(messageId);
            assertThat(duplicateMessage.at("/message/text").asText()).isEqualTo("full smoke hello");
            Integer duplicateCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM messages WHERE context_id = ?::uuid AND context_type = 'plan' AND client_message_id = 'full-smoke-dedup-1'",
                Integer.class,
                planId
            );
            assertThat(duplicateCount).isEqualTo(1);

            JsonNode messages = request("GET", "/api/plans/" + planId + "/messages", creator.token(), null, HttpStatus.OK);
            assertThat(hasMessageType(messages.at("/messages"), "user")).isTrue();
            assertThat(hasMessageType(messages.at("/messages"), "proposal_card")).isTrue();
            assertThat(hasMessageType(messages.at("/messages"), "system")).isTrue();

            JsonNode completed = request("POST", "/api/plans/" + planId + "/complete", creator.token(), null, HttpStatus.OK);
            assertThat(completed.at("/plan/lifecycle_state").asText()).isEqualTo("completed");
            assertThat(participantWs.waitForEvent("plan.completed").at("/payload/plan_id").asText()).isEqualTo(planId);

            JsonNode repeated = request("POST", "/api/plans/" + planId + "/repeat", creator.token(), null, HttpStatus.CREATED);
            String repeatedPlanId = repeated.at("/plan/id").asText();
            assertThat(repeated.at("/plan/lifecycle_state").asText()).isEqualTo("active");
            assertThat(repeated.at("/plan/participants").size()).isEqualTo(4);

            JsonNode notifications = request("GET", "/api/notifications", creator.token(), null, HttpStatus.OK);
            assertThat(notifications.at("/notifications").size()).isGreaterThanOrEqualTo(1);
            String notificationId = notifications.at("/notifications/0/id").asText();
            JsonNode read = request("PATCH", "/api/notifications/" + notificationId + "/read", creator.token(), null, HttpStatus.OK);
            assertThat(read.at("/notification/read").asBoolean()).isTrue();
            JsonNode readAll = request("PATCH", "/api/notifications/read-all", creator.token(), null, HttpStatus.OK);
            assertThat(readAll.size()).isEqualTo(0);

            JsonNode repeatedCompleted = request("POST", "/api/plans/" + repeatedPlanId + "/complete", creator.token(), null, HttpStatus.OK);
            assertThat(repeatedCompleted.at("/plan/lifecycle_state").asText()).isEqualTo("completed");

            verifyContentOpsServicePath(creator.token());
        } finally {
            closeAll(participantWs, invitedWs);
        }
    }

    private void verifyContentOpsServicePath(String token) throws Exception {
        String seed = "full-" + System.currentTimeMillis();
        Map<String, Object> payload = eventPayload(seed);
        Map<String, Object> ingestion = contentOpsService.importNormalizedEvent(payload);
        assertThat(ingestion.get("state")).isEqualTo("imported");
        assertThat(contentOpsService.listIngestions("imported")).anySatisfy(row ->
            assertThat(row.get("id")).isEqualTo(ingestion.get("id"))
        );

        Map<String, Object> sync = contentOpsService.syncNormalizedEvent(eventPayload(seed + "-sync-only"));
        assertThat(sync.get("skipped")).isEqualTo("not published yet; run ops:publish");

        Map<String, Object> published = contentOpsService.publishIngestion(
            UUID.fromString(ingestion.get("id").toString()),
            ContentOpsService.PublishOptions.empty()
        );
        String eventId = published.get("eventId").toString();
        assertThat(published.get("action")).isEqualTo("created");
        JsonNode event = request("GET", "/api/events/" + eventId, token, null, HttpStatus.OK);
        assertThat(event.at("/event/title").asText()).isEqualTo(payload.get("title"));

        assertThatThrownBy(() -> contentOpsService.importNormalizedEvent(Map.of("source_type", "manual")))
            .isInstanceOf(IllegalArgumentException.class);
    }

    private Login login(String phone) throws Exception {
        JsonNode sent = request(
            "POST",
            "/api/auth/otp/send",
            null,
            Map.of("phone", phone),
            HttpStatus.OK
        );
        assertThat(sent.size()).isEqualTo(0);

        JsonNode verified = request(
            "POST",
            "/api/auth/otp/verify",
            null,
            Map.of("phone", phone, "code", "1111"),
            HttpStatus.OK
        );
        assertThat(verified.at("/access_token").asText()).isNotBlank();
        assertThat(verified.at("/refresh_token").asText()).isNotBlank();
        assertThat(verified.at("/user/id").asText()).isNotBlank();
        return new Login(verified.at("/access_token").asText(), verified.at("/user/id").asText());
    }

    private String createPlaceProposal(String token, String planId, String valueText) throws Exception {
        JsonNode response = request(
            "POST",
            "/api/plans/" + planId + "/proposals",
            token,
            Map.of("type", "place", "value_text", valueText, "value_lat", 55.75, "value_lng", 37.61),
            HttpStatus.CREATED
        );
        assertThat(response.at("/proposal/type").asText()).isEqualTo("place");
        assertThat(response.at("/proposal/votes").size()).isEqualTo(0);
        return response.at("/proposal/id").asText();
    }

    private String createTimeProposal(String token, String planId) throws Exception {
        JsonNode response = request(
            "POST",
            "/api/plans/" + planId + "/proposals",
            token,
            Map.of(
                "type", "time",
                "value_text", "20:00",
                "value_datetime", "2026-05-01T20:00:00+03:00"
            ),
            HttpStatus.CREATED
        );
        assertThat(response.at("/proposal/type").asText()).isEqualTo("time");
        return response.at("/proposal/id").asText();
    }

    private JsonNode request(String method, String path, String token, Object body, HttpStatus expectedStatus) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
            .timeout(Duration.ofSeconds(10));
        if (token != null) {
            builder.header("Authorization", "Bearer " + token);
        }
        if (body == null) {
            builder.method(method, HttpRequest.BodyPublishers.noBody());
        } else {
            builder.header("Content-Type", "application/json");
            builder.method(method, HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body)));
        }

        HttpResponse<String> response = HTTP.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode())
            .as("%s %s response body: %s", method, path, response.body())
            .isEqualTo(expectedStatus.value());
        String responseBody = response.body();
        return responseBody == null || responseBody.isBlank() ? JSON.createObjectNode() : JSON.readTree(responseBody);
    }

    private TestWs connect(String token) throws Exception {
        TestWs ws = new TestWs();
        WebSocketSession session = new StandardWebSocketClient()
            .execute(ws, null, URI.create("ws://localhost:" + port + "/api/ws"))
            .get();
        ws.session(session);
        ws.send(Map.of("type", "auth", "token", token));
        JsonNode auth = ws.waitForType("auth_ok");
        assertThat(auth.at("/userId").asText()).isNotBlank();
        return ws;
    }

    private void closeAll(TestWs... clients) throws Exception {
        for (TestWs client : clients) {
            client.close();
        }
    }

    private boolean hasId(JsonNode array, String id) {
        for (JsonNode item : array) {
            if (id.equals(item.at("/id").asText())) {
                return true;
            }
        }
        return false;
    }

    private String participantStatus(JsonNode participants, String userId) {
        for (JsonNode participant : participants) {
            if (userId.equals(participant.at("/user_id").asText())) {
                return participant.at("/status").asText();
            }
        }
        return "";
    }

    private boolean hasMessageType(JsonNode messages, String type) {
        for (JsonNode message : messages) {
            if (type.equals(message.at("/type").asText())) {
                return true;
            }
        }
        return false;
    }

    private Map<String, Object> eventPayload(String seed) {
        Instant starts = Instant.parse("2030-06-01T18:00:00.000Z");
        return Map.ofEntries(
            Map.entry("source_type", "manual"),
            Map.entry("source_url", "https://example.test/events/" + seed),
            Map.entry("source_event_key", "full-smoke-" + seed),
            Map.entry("title", "Full Spring Content Ops " + seed),
            Map.entry("description", "Нормализованное тестовое событие"),
            Map.entry("starts_at", starts.toString()),
            Map.entry("ends_at", starts.plusSeconds(2 * 60 * 60).toString()),
            Map.entry("venue_name", "Full Smoke Venue " + seed),
            Map.entry("address", "Full Smoke Street " + seed),
            Map.entry("cover_image_url", "https://placehold.co/600x400/00B894/white?text=Full"),
            Map.entry("external_url", "https://tickets.example.test/" + seed),
            Map.entry("category", "music"),
            Map.entry("tags", List.of("ops", "full-smoke")),
            Map.entry("price_info", "100 ₽")
        );
    }

    private record Login(String token, String userId) {
    }

    private static class TestWs extends TextWebSocketHandler {
        private final BlockingQueue<JsonNode> messages = new LinkedBlockingQueue<>();
        private WebSocketSession session;

        @Override
        protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
            messages.add(JSON.readTree(message.getPayload()));
        }

        @Override
        public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
            messages.add(JSON.createObjectNode().put("type", "closed").put("code", status.getCode()));
        }

        void session(WebSocketSession session) {
            this.session = session;
        }

        void subscribe(String channel) throws Exception {
            send(Map.of("type", "subscribe", "channel", channel));
            JsonNode subscribed = waitForType("subscribed");
            assertThat(subscribed.at("/channel").asText()).isEqualTo(channel);
        }

        JsonNode waitForEvent(String event) throws Exception {
            return waitFor(node -> "event".equals(node.at("/type").asText()) && event.equals(node.at("/event").asText()));
        }

        JsonNode waitForType(String type) throws Exception {
            return waitFor(node -> type.equals(node.at("/type").asText()));
        }

        void send(Map<String, Object> payload) throws Exception {
            session.sendMessage(new TextMessage(JSON.writeValueAsString(payload)));
        }

        void close() throws Exception {
            if (session != null && session.isOpen()) {
                session.close();
            }
        }

        private JsonNode waitFor(MessagePredicate predicate) throws Exception {
            long deadline = System.nanoTime() + Duration.ofSeconds(10).toNanos();
            while (System.nanoTime() < deadline) {
                JsonNode message = messages.poll(Duration.ofMillis(200).toMillis(), java.util.concurrent.TimeUnit.MILLISECONDS);
                if (message == null) {
                    continue;
                }
                if ("ping".equals(message.at("/type").asText())) {
                    send(Map.of("type", "pong"));
                    continue;
                }
                if (predicate.matches(message)) {
                    return message;
                }
            }
            throw new AssertionError("Timed out waiting for WebSocket message. Remaining: " + messages);
        }
    }

    @FunctionalInterface
    private interface MessagePredicate {
        boolean matches(JsonNode message);
    }
}
