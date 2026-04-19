# Fest&Rest / "Планы?" — Canonical Product Document

## 0. MVP Narrowing Note

This canonical MVP intentionally narrows the original TZ along four axes:

1. **Calendars are replaced by plan-centric coordination.** The original TZ included shared calendars and collaborative event adding. In MVP, Plans Hub ordered chronologically serves as the calendar surface. Calendar is not a separate entity or screen. Device calendar sync is post-MVP.

2. **Map search is postponed.** The original TZ included map mode and map clustering. MVP search is text + category + date + district/metro filters only. Map is an enhancement, not a prerequisite for the core loop.

3. **Auth is simplified for MVP.** Phone OTP only. No email magic link, no social login, no SSO, no multi-factor. Sufficient for validation; expand post-MVP.

4. **Venue/user self-serve event creation is not part of the MVP product surface.** Events and venues are system-managed in MVP. A venue admin tool is an operational necessity for later, not a user-facing MVP feature.

These are intentional MVP scope decisions, not omissions.

---

## 1. Product Understanding

"Планы?" / Fest&Rest is a mobile-first app that bridges the gap between **discovering** events and **coordinating** with friends to attend them.

The problem: people find interesting things but coordination breaks down because nobody commits immediately, details are uncertain, and group chats become chaotic.

Three core entities:
- **Event** = public listing from a venue (discovery layer)
- **Plan** = social coordination object (action layer)
- **Group** = persistent friend circle (reuse layer)

Chat is **subordinate** — it lives inside Plans only, never standalone.

---

## 2. Core Value Proposition

The value is not "finding events" (solved) or "chatting with friends" (solved). The value is making the coordination between discovery and action feel lightweight and structured.

| Existing Tools | Fest&Rest |
|---|---|
| Event listings → no coordination | Event → one tap → plan with friends |
| Messengers → no structure for planning | Plan has proposals, voting, statuses |
| Hard "I'm going" commitment on feed | Soft "мне интересно" + structured commitment in plan |
| No reuse of social groups | Groups + "Повторить" for repeated coordination |

---

## 3. Primary User Flows

### Flow A — Event → Plan
1. Open Home Feed → see event card
2. Tap "Планы?" → create-plan screen opens with event prefilled
3. Select friends or group → optionally toggle "Встретиться до мероприятия"
4. Send invitations → **plan becomes active immediately**; appears in "Мои планы"
5. Invitees receive `plan_invite` notification → set their status (going/thinking/cant)
6. Participants discuss pre-meet details in chat
7. Attend → plan auto-transitions to completed after event time + 4h

### Flow B — Generic Plan (undecided details)
1. Tap center "+" → select activity type (Кино/Кофе/Бар/Прогулка/Ужин/Спорт/Выставка/Другое)
2. Set time: specific, range, or "обсудим"; set place: specific, area, or "решим позже"
3. Invite friends/group → plan becomes active immediately
4. Participants propose place/time → vote → finalize

### Flow C — Proposal & Voting
1. Any participant taps "Предложить место" or "Предложить время"
2. Proposal appears in Details tab AND as proposal card in Chat
3. Other participants vote (multi-select, max 2 per type)
4. Creator finalizes → chosen option becomes confirmed plan data
5. All participants get `plan_finalized` notification

### Flow D — Repeat Past Plan
1. Open past plan → tap "Повторить"
2. New plan created with same participants, same activity type
3. Place/time start undecided → coordinate as usual

### Flow E — Group-Based Planning
1. Open group → tap "Создать план"
2. Group members preselected → plan runs as normal coordination object

---

## 4. MVP Entity Model

### User
`id, phone, name, username, avatar_url, created_at`
Purpose: Identity. MVP: essential.

### Friendship
`id, requester_id, addressee_id, status(pending|accepted), created_at`
Purpose: Bidirectional social graph. MVP: essential.

### Venue
`id, name, description, address, lat, lng, cover_image_url, created_at`
Purpose: Event source. MVP: essential, system-managed.

### Event
`id, venue_id, title, description, cover_image_url, starts_at, ends_at, category, tags[], price_info, external_url, created_at`
Purpose: Discovery surface. MVP: essential.

### EventInterest
`id, user_id, event_id, created_at`
Purpose: Soft public signal. Visible to all friends. MVP: essential.

### SavedEvent
`id, user_id, event_id, created_at`
Purpose: Private bookmark. Not visible to others. MVP: essential.

### Plan (the heart)
`id, creator_id, title, activity_type, linked_event_id(nullable), place_status(confirmed|proposed|undecided), time_status(confirmed|proposed|undecided), confirmed_place_text, confirmed_place_lat, confirmed_place_lng, confirmed_time, lifecycle_state(active|finalized|completed|cancelled), pre_meet_enabled(bool), pre_meet_place_text, pre_meet_time, created_at, updated_at`
Purpose: Social coordination unit. MVP: essential.

### PlanParticipant
`id, plan_id, user_id, status(invited|going|thinking|cant), joined_at`
Purpose: Per-user coordination state. MVP: essential. Note: `invited` is a participant-level status, not a plan-level state.

### PlanProposal
`id, plan_id, proposer_id, type(place|time), value_text, value_lat, value_lng, value_datetime, status(active|finalized|superseded), created_at`
Purpose: Place/time suggestion for voting. MVP: essential.

### Vote
`id, proposal_id, voter_id, created_at`
Purpose: Vote on proposal. MVP: essential. Constraint: max 2 active votes per user per proposal type per plan.

### Group
`id, creator_id, name, avatar_url, created_at`
Purpose: Reusable friend circle. MVP: essential. No group chat. Creator authority derived from `creator_id`, not from a role field.

### GroupMember
`id, group_id, user_id, role(member), joined_at`
Purpose: Group membership. MVP: essential. `role` is `member` only in MVP — admin roles are post-MVP future-proofing.

### Invitation
`id, type(plan|group), target_id, inviter_id, invitee_id, status(pending|accepted|declined), created_at`
Purpose: Actionable invites. MVP: essential.

### Notification
`id, user_id, type, payload(jsonb), read(bool), created_at`
Purpose: Alert surface. MVP: essential.

### Message
`id, context_type(plan), context_id, sender_id, text, type(user|system|proposal_card), reference_id(nullable), created_at`
Purpose: Plan chat message. MVP: essential, text-only. `proposal_card` references a PlanProposal. context_type is `plan` only in MVP.

### Postponed Entities
| Entity | Reason |
|---|---|
| VenueAdmin | System-managed venues in MVP |
| Attachment | Rich media postponed |
| PreMeetProposal | Pre-meet voting postponed |

---

## 5. Canonical MVP Product Rules

- **Plan becomes active immediately upon creation**; no draft or invited state at plan level; `invited` is a participant-level status only
- **Event interest** is visible to all friends; soft curiosity signal, not a commitment
- **Saved events** are private bookmarks; no one else can see them
- **Event-linked plans**: event time/place/venue are read-only anchors; only pre-meet and plan-specific details are editable
- **Event time changes at venue**: auto-update in linked plans + `event_time_changed` notification; plan stays active with update banner
- **Event cancelled**: plan stays active with "Мероприятие отменено" banner; creator must cancel or repurpose; no automatic plan cancellation
- **Plan lifecycle**: active → finalized → completed; cancelled possible from active or finalized; no draft state at plan level
- **Completed transition**: auto at confirmed_time + 4h; if linked event with no confirmed time: event.starts_at + 4h; if neither: creator manually marks completed
- **Participant statuses**: invited → going / thinking / cant; exist only inside plans, never on the feed
- **Proposal types in MVP**: place and time only; no combined proposals
- **Voting rules**: any participant can vote; multi-select up to 2 per proposal type; votes are not anonymous
- **Finalization authority**: creator only
- **Post-finalization edits**: creator can unfinalize (reverts to active); deliberate action
- **Invitation rights**: only creator can invite participants into a plan; participants can only leave
- **Removal rights**: only creator can remove participants; participants can leave themselves
- **No ownership transfer** in MVP; creator is sole admin
- **Max plan size**: 15 participants including creator
- **Group privacy**: all groups are private; members are friends of creator; no public groups
- **Group authority**: creator is sole admin (derived from creator_id); GroupMember.role is `member` only in MVP; admin roles are post-MVP
- **Group invites**: part of MVP; creator invites friends to group; `group_invite` notification type
- **Group chat**: not in MVP; groups are membership containers and plan launch surfaces only
- **Repeat flow**: creates new plan with same participants and activity type; place/time start undecided
- **Pre-meet**: simple optional text fields; no proposals, no voting, no sub-entity; boundary is closed
- **No calendar entity or surface**: Plans Hub ordered chronologically serves as calendar; device sync is post-MVP
- **No map in MVP**: search uses text + category + date + district filters
- **Canonical notification types**: plan_invite, group_invite, proposal_created, plan_finalized, plan_unfinalized, event_time_changed, event_cancelled, plan_reminder, plan_completed

---

## 6. Information Architecture

**Bottom Navigation:**
```
[Главная] [Поиск] [ + ] [Планы] [Профиль]
```

| Tab | Purpose |
|---|---|
| Главная | Event discovery feed |
| Поиск | Text + category + date + district search |
| + | Create plan (core CTA) |
| Планы | Coordination hub (active, invitations, groups, past) |
| Профиль | Self + settings |

**Where things live:**
- Saved events → Profile → "Сохранённые"
- Notifications → Bell icon in header (any screen)
- Invitations → Plans Hub → "Приглашения" section
- Groups → Plans Hub → "Группы" section → Group Screen
- Past plans → Plans Hub → "Прошедшие" section
- Chat → Inside Plan Details only

---

## 7. Screen-by-Screen Logic

### A. Home Feed
- **Purpose**: Primary event discovery
- **Actions**: Browse, mark interest, save, open details, create plan
- **Data**: Paginated events, friends' interests, friends' plans per event
- **Edge states**: Empty feed, no friends (no social proof), offline
- **Navigation**: → Event Details, → Create Plan, → Notifications, → Profile

### B. Event Details
- **Purpose**: Deep dive + bridge to plan creation
- **Actions**: Interest, save, share, "Планы?" CTA
- **Data**: Full event + venue, friends interested, friends' plans for this event
- **Edge states**: Event cancelled/past, no friends interested
- **Navigation**: → Create Plan from Event, → Venue Screen, → external map

### C. Create Plan from Event
- **Purpose**: Quick plan anchored to event
- **Actions**: Select friends/groups, toggle pre-meet, send invites
- **Data**: Event (prefilled, read-only), friends list, groups list
- **Edge states**: No friends, event is past
- **Navigation**: → Plan Details (after creation), ← Event Details

### D. Generic Create Plan
- **Purpose**: Plan from scratch with uncertainty
- **Actions**: Pick activity, set flexible time/place, invite friends
- **Data**: Activity types, friends, groups
- **Edge states**: No friends, no groups
- **Navigation**: → Plan Details (after creation)

### E. Plan Details (Детали / Чат)
**Детали tab**: title, linked event, participants+statuses, confirmed place/time or voting blocks, proposals, "Предложить место/время" buttons, finalization control (creator)
**Чат tab**: message thread (user/system/proposal_card), text input only
- **Edge states**: No proposals, only creator, finalized (read-only details)
- **Navigation**: → Friend profile, → Event Details (from linked event)

### F. Plans Hub
- **Purpose**: Coordination dashboard, chronologically ordered (= calendar view)
- **Sections**: Активные | Приглашения | Группы | Прошедшие
- **Actions**: Open plan, accept/decline invite, open group, repeat past plan, create plan
- **Edge states**: No plans, no invitations, no groups
- **Navigation**: → Plan Details, → Group Screen, → Create Plan

### G. Group Screen
- **Purpose**: Reusable friend circle and plan launch surface
- **Contains**: Members, upcoming plans, past plans, "Создать план" action
- **No chat** in MVP
- **Edge states**: Only creator, no plans
- **Navigation**: → Plan Details, → Create Plan, → User profile

### H. Notifications
- **Purpose**: Actionable + passive alerts
- **MVP types**: plan_invite, group_invite, proposal_created, plan_finalized, plan_unfinalized, event_time_changed, event_cancelled, plan_reminder, plan_completed
- **Edge states**: Empty, many unread
- **Navigation**: → Plan Details, → Event Details, → Group Screen

### I. Profile
- **Purpose**: Self-management
- **Contains**: Avatar/name, friends, saved events, settings
- **Edge states**: New user
- **Navigation**: → Friend profile, → Event Details (from saved), → Venue Screen

### J. Search
- **Purpose**: Active discovery
- **Actions**: Text search, category filter, date filter, district/metro filter
- **No map** in MVP
- **Edge states**: No results, no location set
- **Navigation**: → Event Details, → Venue Screen

### K. Venue Screen
- **Purpose**: Venue identity + event list
- **Actions**: View info, browse events
- **Edge states**: No upcoming events
- **Navigation**: → Event Details

---

## 8. State Model — Plans & Voting

### Plan Lifecycle
```
active ──→ finalized ──→ completed
  │            │
  └──→ cancelled ←──┘
```

- **active**: Live from creation; proposals/voting open; participants may still be in `invited` status
- **finalized**: Creator confirmed place AND time; locked for new proposals
- **completed**: Auto-transition at confirmed_time + 4h (or event.starts_at + 4h for linked plans without confirmed time; manual if neither); read-only; "Повторить" available
- **cancelled**: Creator cancelled; read-only

Creator can **unfinalize** → reverts to active (reopens proposals).

### Voting Rules
1. Any participant can propose place or time
2. Multiple active proposals per type allowed
3. Multi-select voting, max 2 per type per voter
4. Creator finalizes by selecting one proposal
5. After finalization: no new proposals; creator unfinalizes to reopen
6. If no consensus: creator decides
7. Proposal cards in chat and voting cards in details = same PlanProposal entity, rendered differently

---

## 9. Backend/API Proposal

### Resource Groups
```
Auth:      POST /auth/otp/send, POST /auth/otp/verify, POST /auth/refresh, GET /auth/me
Users:     GET /users/me, PATCH /users/me, GET /users/:id
           GET /users/friends, POST /users/friends/:id, DELETE /users/friends/:id
Events:    GET /events, /events/:id
           POST /events/:id/interest, DELETE /events/:id/interest
           POST /events/:id/save, DELETE /events/:id/save
Venues:    GET /venues, /venues/:id, /venues/:id/events
Plans:     GET /plans, POST /plans, GET /plans/:id, PATCH /plans/:id
           POST /plans/:id/finalize, POST /plans/:id/unfinalize
           POST /plans/:id/cancel, POST /plans/:id/complete
           GET /plans/:id/participants, PATCH /plans/:id/participants/:uid
           POST /plans/:id/invitations
           POST /plans/:id/proposals
           POST /plans/:id/proposals/:pid/vote, DELETE /plans/:id/proposals/:pid/vote
           GET /plans/:id/messages, POST /plans/:id/messages
Groups:    GET /groups, POST /groups, GET /groups/:id, PATCH /groups/:id
           GET /groups/:id/members, POST /groups/:id/members
           GET /groups/:id/plans, POST /groups/:id/plans
Invites:   GET /invitations, PATCH /invitations/:id
Search:    GET /search/events, /search/venues, /search/users
Notifications: GET /notifications, PATCH /notifications/:id/read, PATCH /notifications/read-all
```

No group message endpoints. Groups are containers, not chat surfaces.

### Real-time Needs
- WebSocket channels: per-plan (chat + vote updates), per-user (notifications)
- Optimistic: votes, messages, interest, saves
- Server-confirmed: plan state changes, invitation responses

### Mock-first Priority
1. Phase 1-2: Hardcoded events/venues, local state, no backend
2. Phase 3: Mock API layer (MSW or JSON Server)
3. Phase 4: Real backend with WebSocket
4. Phase 5+: Full backend with push notifications, auth

---

## 10. Frontend State Considerations

| Domain | Store | Notes |
|---|---|---|
| Events | Normalized by ID, paginated | Invalidation on interest/save change |
| Plans | Normalized by ID, embedded participants/proposals | Real-time sync via WS |
| Chat | Per-plan message arrays, append-only | Optimistic send |
| Votes | Count on proposal, user's votes tracked | Optimistic toggle |
| Groups | Normalized by ID, member lists | Lazy-loaded on group screen |
| Notifications | List with read/unread, badge count | Push + WS |
| Auth | Token, user profile | Secure storage |
| UI | Active tab, modals, loading states | Ephemeral |

State management: Zustand (lightweight, works with RN + WS).

---

## 11. MVP Scope vs Postponed

### In MVP
- Auth (phone OTP)
- Event feed (chronological + category filter)
- Event details
- Save event / Mark interest
- Create plan from event
- Create generic plan
- Plan details (Детали + Чат)
- Plan chat (text only)
- Proposals (place + time)
- Voting (multi-select max 2)
- Plan finalization / unfinalization / cancel / manual complete
- Plans hub (active, invitations, groups, past)
- Basic groups (create, invite friends, view, create plan from group) — no group chat
- Plan invitations (creator-only invite)
- "Повторить" on past plans
- Notifications (9 canonical types)
- Search (text + category + date + district)
- Venue page (view only)
- Profile (view + edit basics)
- Friend system (add, list, accept)

### Postponed
- Map view / map search
- Device calendar sync / shared calendar
- Group chat
- Advanced recommendations / personalization
- Ticketing / payment
- Rich media chat
- Moderation tools
- Venue admin panel
- Venue subscription / follow
- Pre-meet proposals/voting
- Public groups
- Deep linking / external sharing
- Push notification preferences
- Monetization
- User reviews / ratings
- Combined place+time proposals
- Plan ownership transfer
- Admin roles beyond creator
- Configurable max plan size
- Venue/user self-serve event creation

---

## 12. Risks & Unresolved Questions

| Risk | Status |
|---|---|
| Cold start (no events, no users) | Unresolved — requires business strategy |
| Creator-only invite may feel restrictive | Accepted trade-off; can relax post-MVP |
| Users may create empty plans as group chat workaround | Monitor analytics; reconsider group chat if pattern emerges |
| Event data source — who enters events? | Operational question; system-managed for MVP |
| 15-participant cap — too low or too high? | Tentative; adjust based on usage |
| Should "Думаю" participants get proposal notifications? | Yes — all participants receive all plan notifications regardless of status |

---

## 13. Implementation Phases

### Phase 1 — Foundation (1-2 weeks)
- Goals: Project scaffold, types, navigation, auth skeleton, mock data
- Dependencies: None
- Deliverables: Expo app, 5-tab navigation, auth screen, TypeScript types, hardcoded event mocks, "Soft Shell" theme tokens
- Risks: Expo SDK configuration, WS compatibility

### Phase 2 — Discovery (1-2 weeks)
- Goals: Home feed, event details, save, interest
- Dependencies: Phase 1
- Deliverables: Event feed with cards, event detail screen, interest/save with local state, social proof
- Risks: Image loading, event data quality

### Phase 3 — Plan Creation (1-2 weeks)
- Goals: Create plan from event, generic create, friend/group selection
- Dependencies: Phase 2
- Deliverables: Two creation flows, friend/group picker, invitation sending (mock), plan list in Plans Hub
- Risks: Generic plan UX (flexible time/place flow)

### Phase 4 — Plan Core (2-3 weeks)
- Goals: Plan details, chat, proposals, voting, finalization
- Dependencies: Phase 3, backend WS
- Deliverables: Plan detail screen, proposal creation, voting UI, finalization, real-time chat, optimistic updates
- Risks: Real-time complexity, voting edge cases

### Phase 5 — Coordination Hub (1-2 weeks)
- Goals: Plans hub sections, groups, invitations, past plans, "Повторить", notifications
- Dependencies: Phase 4
- Deliverables: Plans hub, group screen (no chat), invitation management, "Повторить", notification center
- Risks: Information density in Plans Hub

### Phase 6 — Discovery & Polish (1-2 weeks)
- Goals: Search, venues, profile, edge states, visual polish
- Dependencies: Phase 5
- Deliverables: Search with filters, venue screen, profile, empty/error/loading states, design polish
- Risks: Scope creep, low-end device performance

**Total MVP: ~8-13 weeks**

---

## 14. Architecture Direction

```
┌─────────────────────────────────────────────┐
│        React Native / Expo / TypeScript     │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Zustand  │ │  Expo    │ │  Custom UI   │ │
│  │  stores  │ │  Router  │ │  "Soft Shell"│ │
│  └────┬─────┘ └────┬─────┘ └──────┬───────┘ │
│       │            │               │         │
│  ┌────┴────────────┴───────────────┴───────┐ │
│  │      API Client + Real-time Layer        │ │
│  └──────────────────┬──────────────────────┘ │
└─────────────────────┼────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │  Mock API (Phase 1-3) │
          │  Real API (Phase 4+)  │
          └───────────┬───────────┘
                      │
┌─────────────────────┼────────────────────────┐
│       Backend (Phase 4+)                      │
│       Stack: RECOMMENDED, not canonical       │
│  ┌───────────────┐  ┌──────────────────────┐ │
│  │ API Server    │  │  DB + Cache          │ │
│  │ (recommended: │  │  (recommended:       │ │
│  │  Fastify/Go/ │  │   PostgreSQL+Redis   │ │
│  │  FastAPI)    │  │   or equivalent)      │ │
│  └───────────────┘  └──────────────────────┘ │
│  Real-time: WebSocket (product requirement)  │
│  Auth: JWT + OTP (recommended)               │
│  Media: S3-compatible + CDN (recommended)   │
└──────────────────────────────────────────────┘
```

**Principles:**
1. Plan is the aggregate root
2. Event data is read-only from user perspective
3. Two bounded contexts: Discovery and Coordination
4. Mock-first through Phase 3
5. Optimistic for votes/chat/saves; server-confirmed for state changes
6. Backend stack is recommended, not canonical — product model is stack-agnostic
