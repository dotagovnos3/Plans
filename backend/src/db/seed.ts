import { query } from './pool.js';

const IDS = {
  v1: '11111111-1111-4111-8111-111111111111',
  v2: '22222222-2222-4222-8222-222222222222',
  v3: '33333333-3333-4333-8333-333333333333',
  v4: '44444444-4444-4444-8444-444444444444',
  v5: '55555555-5555-4555-8555-555555555555',
  e1: '61111111-1111-4111-8111-111111111111',
  e2: '62222222-2222-4222-8222-222222222222',
  e3: '63333333-3333-4333-8333-333333333333',
  e4: '64444444-4444-4444-8444-444444444444',
  e5: '65555555-5555-4555-8555-555555555555',
  e6: '66666666-6666-4666-8666-666666666666',
  p1: '71111111-1111-4111-8111-111111111111',
  p2: '72222222-2222-4222-8222-222222222222',
  p3: '73333333-3333-4333-8333-333333333333',
  g1: '81111111-1111-4111-8111-111111111111',
  g2: '82222222-2222-4222-8222-222222222222',
  prop1: '91111111-1111-4111-8111-111111111111',
  prop2: '92222222-2222-4222-8222-222222222222',
  msg1: 'a1111111-1111-4111-8111-111111111111',
  msg2: 'a2222222-2222-4222-8222-222222222222',
  msg3: 'a3333333-3333-4333-8333-333333333333',
  n1: 'b1111111-1111-4111-8111-111111111111',
  n2: 'b2222222-2222-4222-8222-222222222222',
};

const USERS = [
  { key: 'me', phone: '+79990000000', name: 'Я', username: 'me' },
  { key: 'u1', phone: '+79991111111', name: 'Маша', username: 'masha' },
  { key: 'u2', phone: '+79992222222', name: 'Дима', username: 'dima' },
  { key: 'u3', phone: '+79993333333', name: 'Лена', username: 'lena' },
  { key: 'u4', phone: '+79994444444', name: 'Артём', username: 'artem' },
  { key: 'u5', phone: '+79995555555', name: 'Катя', username: 'katya' },
] as const;

function pair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function upsertUsers() {
  const out: Record<string, string> = {};

  for (const user of USERS) {
    const row = (await query(
      `INSERT INTO users (phone, name, username)
       VALUES ($1, $2, $3)
       ON CONFLICT (phone) DO UPDATE
       SET name = EXCLUDED.name,
           username = EXCLUDED.username
       RETURNING id`,
      [user.phone, user.name, user.username]
    )).rows[0];

    out[user.key] = row.id;
  }

  return out as Record<(typeof USERS)[number]['key'], string>;
}

async function seed() {
  console.log('Seeding dev data...');

  const { me, u1, u2, u3, u4, u5 } = await upsertUsers();

  const [f1r, f1a] = pair(me, u1);
  const [f2r, f2a] = pair(me, u2);
  const [f3r, f3a] = pair(me, u3);
  const [f4r, f4a] = pair(me, u4);
  const [f5r, f5a] = pair(me, u5);
  const [f6r, f6a] = pair(u1, u2);
  const [f7r, f7a] = pair(u2, u3);

  await query(`
    INSERT INTO friendships (requester_id, addressee_id, status)
    VALUES
      ('${f1r}','${f1a}','accepted'),
      ('${f2r}','${f2a}','accepted'),
      ('${f3r}','${f3a}','accepted'),
      ('${f4r}','${f4a}','accepted'),
      ('${f5r}','${f5a}','accepted'),
      ('${f6r}','${f6a}','accepted'),
      ('${f7r}','${f7a}','accepted')
    ON CONFLICT (requester_id, addressee_id) DO UPDATE
    SET status = EXCLUDED.status
  `);

  await query(`
    INSERT INTO venues (id, name, description, address, lat, lng, cover_image_url)
    VALUES
      ('${IDS.v1}','Музей современного искусства','Крупнейший музей','ул. Гоголя, 15',55.7558,37.6173,'https://placehold.co/600x400/6C5CE7/white?text=Museum'),
      ('${IDS.v2}','Бар «Ночь»','Коктейль-бар','ул. Тверская, 22',55.765,37.605,'https://placehold.co/600x400/FD79A8/white?text=Bar'),
      ('${IDS.v3}','Кинотеатр «Иллюзион»','Артхаус','Кутузовский пр., 8',55.74,37.57,'https://placehold.co/600x400/00B894/white?text=Cinema'),
      ('${IDS.v4}','Стадион «Центральный»','Спорт','Лужники',55.715,37.555,'https://placehold.co/600x400/74B9FF/white?text=Stadium'),
      ('${IDS.v5}','Галерея «Новый взгляд»','Молодые художники','Патриаршие, 3',55.76,37.59,'https://placehold.co/600x400/FDCB6E/white?text=Gallery')
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        description = EXCLUDED.description,
        address = EXCLUDED.address,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        cover_image_url = EXCLUDED.cover_image_url
  `);

  await query(`
    INSERT INTO events (id, venue_id, title, description, cover_image_url, starts_at, ends_at, category, tags, price_info)
    VALUES
      ('${IDS.e1}','${IDS.v1}','Ретроспектива Кабакова','Масштабная выставка','https://placehold.co/600x400/6C5CE7/white?text=Kabakov','2026-04-25T10:00:00+03:00','2026-04-25T20:00:00+03:00','exhibition',ARRAY['искусство'],'500 ₽'),
      ('${IDS.e2}','${IDS.v2}','Джазовый вечер','Живой джаз','https://placehold.co/600x400/FD79A8/white?text=Jazz','2026-04-22T20:00:00+03:00','2026-04-23T02:00:00+03:00','music',ARRAY['джаз'],'Вход свободный'),
      ('${IDS.e3}','${IDS.v3}','Фестиваль японского кино','Куросава, Мидзогути, Одзу','https://placehold.co/600x400/00B894/white?text=Japan+Cinema','2026-04-26T14:00:00+03:00','2026-04-26T22:00:00+03:00','other',ARRAY['кино'],'350 ₽'),
      ('${IDS.e4}','${IDS.v4}','Дерби: Спартак — Динамо','Главный матч тура','https://placehold.co/600x400/74B9FF/white?text=Derby','2026-04-27T19:00:00+03:00','2026-04-27T21:00:00+03:00','sport',ARRAY['футбол'],'от 1200 ₽'),
      ('${IDS.e5}','${IDS.v5}','Нео-импрессионизм','Новая выставка','https://placehold.co/600x400/FDCB6E/white?text=Neo-Impressionism','2026-04-23T12:00:00+03:00','2026-04-23T21:00:00+03:00','exhibition',ARRAY['живопись'],'300 ₽'),
      ('${IDS.e6}','${IDS.v2}','Techno Night','Ночь техно из Берлина','https://placehold.co/600x400/A29BFE/white?text=Techno','2026-04-24T23:00:00+03:00','2026-04-25T06:00:00+03:00','party',ARRAY['техно'],'800 ₽')
    ON CONFLICT (id) DO UPDATE
    SET venue_id = EXCLUDED.venue_id,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        cover_image_url = EXCLUDED.cover_image_url,
        starts_at = EXCLUDED.starts_at,
        ends_at = EXCLUDED.ends_at,
        category = EXCLUDED.category,
        tags = EXCLUDED.tags,
        price_info = EXCLUDED.price_info
  `);

  await query(`
    INSERT INTO event_interests (user_id, event_id)
    VALUES
      ('${u1}','${IDS.e1}'),
      ('${u2}','${IDS.e2}'),
      ('${u3}','${IDS.e2}'),
      ('${u4}','${IDS.e4}'),
      ('${u1}','${IDS.e5}'),
      ('${u5}','${IDS.e5}'),
      ('${u2}','${IDS.e6}')
    ON CONFLICT (user_id, event_id) DO NOTHING
  `);

  await query(`
    INSERT INTO plans (
      id, creator_id, title, activity_type, linked_event_id, place_status, time_status,
      confirmed_place_text, confirmed_place_lat, confirmed_place_lng, confirmed_time,
      lifecycle_state, pre_meet_enabled, pre_meet_place_text, pre_meet_time
    )
    VALUES
      ('${IDS.p1}','${me}','Джазовый вечер','bar','${IDS.e2}','confirmed','confirmed','Бар «Ночь»',55.765,37.605,'2026-04-22T20:00:00+03:00','active',true,'Метро Тверская','2026-04-22T19:30:00+03:00'),
      ('${IDS.p2}','${me}','Кино в субботу','cinema',NULL,'proposed','confirmed',NULL,NULL,NULL,'2026-04-26T18:00:00+03:00','active',false,NULL,NULL),
      ('${IDS.p3}','${me}','Выставка Кабакова','exhibition','${IDS.e1}','confirmed','confirmed','Музей современного искусства',55.7558,37.6173,'2026-04-12T10:00:00+03:00','completed',false,NULL,NULL)
    ON CONFLICT (id) DO UPDATE
    SET creator_id = EXCLUDED.creator_id,
        title = EXCLUDED.title,
        activity_type = EXCLUDED.activity_type,
        linked_event_id = EXCLUDED.linked_event_id,
        place_status = EXCLUDED.place_status,
        time_status = EXCLUDED.time_status,
        confirmed_place_text = EXCLUDED.confirmed_place_text,
        confirmed_place_lat = EXCLUDED.confirmed_place_lat,
        confirmed_place_lng = EXCLUDED.confirmed_place_lng,
        confirmed_time = EXCLUDED.confirmed_time,
        lifecycle_state = EXCLUDED.lifecycle_state,
        pre_meet_enabled = EXCLUDED.pre_meet_enabled,
        pre_meet_place_text = EXCLUDED.pre_meet_place_text,
        pre_meet_time = EXCLUDED.pre_meet_time
  `);

  await query(`
    INSERT INTO plan_participants (plan_id, user_id, status)
    VALUES
      ('${IDS.p1}','${me}','going'),
      ('${IDS.p1}','${u2}','going'),
      ('${IDS.p1}','${u3}','thinking'),
      ('${IDS.p2}','${me}','going'),
      ('${IDS.p2}','${u1}','going'),
      ('${IDS.p2}','${u2}','invited'),
      ('${IDS.p3}','${me}','going'),
      ('${IDS.p3}','${u1}','going'),
      ('${IDS.p3}','${u5}','going')
    ON CONFLICT (plan_id, user_id) DO UPDATE
    SET status = EXCLUDED.status
  `);

  await query(`
    INSERT INTO plan_proposals (id, plan_id, proposer_id, type, value_text, status)
    VALUES
      ('${IDS.prop1}','${IDS.p2}','${u1}','place','Иллюзион','active'),
      ('${IDS.prop2}','${IDS.p2}','${me}','place','КиноМакс','active')
    ON CONFLICT (id) DO UPDATE
    SET plan_id = EXCLUDED.plan_id,
        proposer_id = EXCLUDED.proposer_id,
        type = EXCLUDED.type,
        value_text = EXCLUDED.value_text,
        status = EXCLUDED.status
  `);

  await query(`
    INSERT INTO votes (proposal_id, voter_id)
    VALUES
      ('${IDS.prop1}','${u2}'),
      ('${IDS.prop1}','${me}')
    ON CONFLICT (proposal_id, voter_id) DO NOTHING
  `);

  await query(`
    INSERT INTO messages (id, context_type, context_id, sender_id, text, type, reference_id)
    VALUES
      ('${IDS.msg1}','plan','${IDS.p1}','${me}','Встречаемся у метро в 19:30','user',NULL),
      ('${IDS.msg2}','plan','${IDS.p1}','${u2}','Ок, буду!','user',NULL),
      ('${IDS.msg3}','plan','${IDS.p1}','${u3}','Я наверное опоздаю чуть-чуть','user',NULL)
    ON CONFLICT (id) DO UPDATE
    SET context_type = EXCLUDED.context_type,
        context_id = EXCLUDED.context_id,
        sender_id = EXCLUDED.sender_id,
        text = EXCLUDED.text,
        type = EXCLUDED.type,
        reference_id = EXCLUDED.reference_id
  `);

  await query(`
    INSERT INTO groups (id, creator_id, name)
    VALUES
      ('${IDS.g1}','${me}','Кино-клуб'),
      ('${IDS.g2}','${me}','Барная компания')
    ON CONFLICT (id) DO UPDATE
    SET creator_id = EXCLUDED.creator_id,
        name = EXCLUDED.name
  `);

  await query(`
    INSERT INTO group_members (group_id, user_id, role)
    VALUES
      ('${IDS.g1}','${me}','member'),
      ('${IDS.g1}','${u1}','member'),
      ('${IDS.g1}','${u2}','member'),
      ('${IDS.g2}','${me}','member'),
      ('${IDS.g2}','${u2}','member'),
      ('${IDS.g2}','${u3}','member'),
      ('${IDS.g2}','${u4}','member')
    ON CONFLICT (group_id, user_id) DO NOTHING
  `);

  await query(`
    INSERT INTO invitations (type, target_id, inviter_id, invitee_id, status)
    VALUES ('plan','${IDS.p1}','${u2}','${me}','pending')
    ON CONFLICT (type, target_id, invitee_id) DO UPDATE
    SET status = EXCLUDED.status,
        inviter_id = EXCLUDED.inviter_id
  `);

  await query(`
    INSERT INTO notifications (id, user_id, type, payload, read)
    VALUES
      ('${IDS.n1}','${me}','plan_invite','${JSON.stringify({ plan_id: IDS.p1, inviter_name: 'Дима' })}'::jsonb,false),
      ('${IDS.n2}','${me}','proposal_created','${JSON.stringify({ plan_id: IDS.p2, proposer_name: 'Маша' })}'::jsonb,false)
    ON CONFLICT (id) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        type = EXCLUDED.type,
        payload = EXCLUDED.payload,
        read = EXCLUDED.read
  `);

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
