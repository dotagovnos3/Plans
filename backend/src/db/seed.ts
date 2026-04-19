import { query } from './pool.js';

async function seed() {
  console.log('Seeding dev data...');

  const users = (await query(
    `INSERT INTO users (id, phone, name, username) VALUES
    ('u1', '+79991111111', 'Маша', 'masha'),
    ('u2', '+79992222222', 'Дима', 'dima'),
    ('u3', '+79993333333', 'Лена', 'lena'),
    ('u4', '+79994444444', 'Артём', 'artem'),
    ('u5', '+79995555555', 'Катя', 'katya'),
    ('me', '+79990000000', 'Я', 'me')
    ON CONFLICT (id) DO NOTHING RETURNING *`
  )).rows;

  await query(
    `INSERT INTO friendships (requester_id, addressee_id, status) VALUES
    ('me', 'u1', 'accepted'), ('me', 'u2', 'accepted'), ('me', 'u3', 'accepted'),
    ('me', 'u4', 'accepted'), ('me', 'u5', 'accepted'),
    ('u1', 'u2', 'accepted'), ('u2', 'u3', 'accepted')
    ON CONFLICT (requester_id, addressee_id) DO NOTHING`
  );

  await query(
    `INSERT INTO venues (id, name, description, address, lat, lng, cover_image_url) VALUES
    ('v1', 'Музей современного искусства', 'Крупнейший музей', 'ул. Гоголя, 15', 55.7558, 37.6173, 'https://placehold.co/600x400/6C5CE7/white?text=Museum'),
    ('v2', 'Бар «Ночь»', 'Коктейль-бар', 'ул. Тверская, 22', 55.765, 37.605, 'https://placehold.co/600x400/FD79A8/white?text=Bar'),
    ('v3', 'Кинотеатр «Иллюзион»', 'Артхаус', 'Кутузовский пр., 8', 55.74, 37.57, 'https://placehold.co/600x400/00B894/white?text=Cinema'),
    ('v4', 'Стадион «Центральный»', 'Спорт', 'Лужники', 55.715, 37.555, 'https://placehold.co/600x400/74B9FF/white?text=Stadium'),
    ('v5', 'Галерея «Новый взгляд»', 'Молодые художники', 'Патриаршие, 3', 55.76, 37.59, 'https://placehold.co/600x400/FDCB6E/white?text=Gallery')
    ON CONFLICT (id) DO NOTHING`
  );

  await query(
    `INSERT INTO events (id, venue_id, title, description, cover_image_url, starts_at, ends_at, category, tags, price_info) VALUES
    ('e1', 'v1', 'Ретроспектива Кабакова', 'Масштабная выставка', 'https://placehold.co/600x400/6C5CE7/white?text=Kabakov', '2026-04-25T10:00:00+03:00', '2026-04-25T20:00:00+03:00', 'exhibition', ARRAY['искусство'], '500 ₽'),
    ('e2', 'v2', 'Джазовый вечер', 'Живой джаз', 'https://placehold.co/600x400/FD79A8/white?text=Jazz', '2026-04-22T20:00:00+03:00', '2026-04-23T02:00:00+03:00', 'music', ARRAY['джаз'], 'Вход свободный'),
    ('e3', 'v3', 'Фестиваль японского кино', 'Куросава, Мидзогути, Одзу', 'https://placehold.co/600x400/00B894/white?text=Japan+Cinema', '2026-04-26T14:00:00+03:00', '2026-04-26T22:00:00+03:00', 'other', ARRAY['кино'], '350 ₽'),
    ('e4', 'v4', 'Дерби: Спартак — Динамо', 'Главный матч тура', 'https://placehold.co/600x400/74B9FF/white?text=Derby', '2026-04-27T19:00:00+03:00', '2026-04-27T21:00:00+03:00', 'sport', ARRAY['футбол'], 'от 1200 ₽'),
    ('e5', 'v5', 'Нео-импрессионизм', 'Новая выставка', 'https://placehold.co/600x400/FDCB6E/white?text=Neo-Impressionism', '2026-04-23T12:00:00+03:00', '2026-04-23T21:00:00+03:00', 'exhibition', ARRAY['живопись'], '300 ₽'),
    ('e6', 'v2', 'Techno Night', 'Ночь техно из Берлина', 'https://placehold.co/600x400/A29BFE/white?text=Techno', '2026-04-24T23:00:00+03:00', '2026-04-25T06:00:00+03:00', 'party', ARRAY['техно'], '800 ₽')
    ON CONFLICT (id) DO NOTHING`
  );

  await query(`INSERT INTO event_interests (user_id, event_id) VALUES ('u1', 'e1'), ('u2', 'e2'), ('u3', 'e2'), ('u4', 'e4'), ('u1', 'e5'), ('u5', 'e5'), ('u2', 'e6') ON CONFLICT (user_id, event_id) DO NOTHING`);

  await query(
    `INSERT INTO plans (id, creator_id, title, activity_type, linked_event_id, place_status, time_status, confirmed_place_text, confirmed_place_lat, confirmed_place_lng, confirmed_time, lifecycle_state, pre_meet_enabled, pre_meet_place_text, pre_meet_time) VALUES
    ('p1', 'me', 'Джазовый вечер', 'bar', 'e2', 'confirmed', 'confirmed', 'Бар «Ночь»', 55.765, 37.605, '2026-04-22T20:00:00+03:00', 'active', true, 'Метро Тверская', '2026-04-22T19:30:00+03:00'),
    ('p2', 'me', 'Кино в субботу', 'cinema', NULL, 'undecided', 'confirmed', NULL, NULL, NULL, '2026-04-26T18:00:00+03:00', 'active', false, NULL, NULL),
    ('p3', 'me', 'Выставка Кабакова', 'exhibition', 'e1', 'confirmed', 'confirmed', 'Музей современного искусства', 55.7558, 37.6173, '2026-04-12T10:00:00+03:00', 'completed', false, NULL, NULL)
    ON CONFLICT (id) DO NOTHING`
  );

  await query(
    `INSERT INTO plan_participants (id, plan_id, user_id, status) VALUES
    ('pp1', 'p1', 'me', 'going'), ('pp2', 'p1', 'u2', 'going'), ('pp3', 'p1', 'u3', 'thinking'),
    ('pp4', 'p2', 'me', 'going'), ('pp5', 'p2', 'u1', 'going'), ('pp6', 'p2', 'u2', 'invited'),
    ('pp7', 'p3', 'me', 'going'), ('pp8', 'p3', 'u1', 'going'), ('pp9', 'p3', 'u5', 'going')
    ON CONFLICT (plan_id, user_id) DO NOTHING`
  );

  await query(
    `INSERT INTO groups (id, creator_id, name) VALUES
    ('g1', 'me', 'Кино-клуб'), ('g2', 'me', 'Барная компания')
    ON CONFLICT (id) DO NOTHING`
  );

  await query(
    `INSERT INTO group_members (group_id, user_id, role) VALUES
    ('g1', 'me', 'member'), ('g1', 'u1', 'member'), ('g1', 'u2', 'member'),
    ('g2', 'me', 'member'), ('g2', 'u2', 'member'), ('g2', 'u3', 'member'), ('g2', 'u4', 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING`
  );

  await query(
    `INSERT INTO invitations (id, type, target_id, inviter_id, invitee_id, status) VALUES
    ('i1', 'plan', 'p1', 'u2', 'me', 'pending')
    ON CONFLICT (id) DO NOTHING`
  );

  await query(
    `INSERT INTO notifications (user_id, type, payload) VALUES
    ('me', 'plan_invite', '{"plan_id":"p1","inviter_name":"Дима"}'),
    ('me', 'proposal_created', '{"plan_id":"p2","proposer_name":"Маша"}')
    ON CONFLICT DO NOTHING`
  );

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
