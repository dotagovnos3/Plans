# Slice 1 Acceptance Checklist

## Auth
- [ ] POST /auth/otp/send returns 200 for valid phone
- [ ] POST /auth/otp/verify returns tokens + user for code 1111
- [ ] POST /auth/otp/verify returns 401 for wrong code
- [ ] POST /auth/refresh returns new token pair
- [ ] GET /auth/me returns current user with valid JWT

## Events
- [ ] GET /events returns paginated list with venue + social proof
- [ ] GET /events?category=music filters by category
- [ ] GET /events/:id returns single event with venue + social proof
- [ ] GET /events/:id returns 404 for missing event
- [ ] POST /events/:id/interest creates interest (idempotent)
- [ ] DELETE /events/:id/interest removes interest
- [ ] POST /events/:id/save creates save (idempotent)
- [ ] DELETE /events/:id/save removes save

## Venues
- [ ] GET /venues/:id returns venue detail
- [ ] GET /venues/:id/events returns events at venue with pagination

## Plans
- [ ] POST /plans creates plan + creator as going + others as invited + invitations + notifications (atomic)
- [ ] GET /plans returns plans filtered by lifecycle + participant=me
- [ ] GET /plans/:id returns plan with participants + proposals + linked event
- [ ] PATCH /plans/:id updates pre-meet fields (creator only, 403 for others)
- [ ] POST /plans/:id/cancel sets lifecycle=cancelled (creator only)
- [ ] POST /plans/:id/complete sets lifecycle=completed (creator only)
- [ ] Max 15 participants enforced (409 on exceed via invitation accept)

## Participants
- [ ] GET /plans/:planId/participants returns list
- [ ] PATCH /plans/:planId/participants/:uid updates status (self or creator)
- [ ] DELETE /plans/:planId/participants/:uid removes participant (self or creator)

## Invitations
- [ ] GET /invitations?status=pending returns pending invitations with plan/group stubs
- [ ] PATCH /invitations/:id {status: accepted} creates plan participant + returns updated invitation
- [ ] PATCH /invitations/:id {status: accepted} for group creates group_member
- [ ] PATCH /invitations/:id {status: declined} declines without side-effects
- [ ] Already-responded invitation returns 400

## Groups
- [ ] GET /groups returns user's groups with member_count
- [ ] POST /groups creates group + adds creator as member + invites others
- [ ] GET /groups/:id returns group with members
- [ ] POST /groups/:id/members adds member + invitation + notification (creator only)
- [ ] DELETE /groups/:id/members/:uid removes member (creator or self)

## Notifications
- [ ] GET /notifications returns list + unread_count
- [ ] PATCH /notifications/:id/read marks single notification read
- [ ] PATCH /notifications/read-all marks all read

## Search
- [ ] GET /search/events?q=джаз returns matching events
- [ ] GET /search/events?category=music filters by category

## Security
- [ ] All endpoints except /auth/otp/send and /auth/otp/verify require JWT
- [ ] Creator-only actions return 403 for non-creators
