--
-- Mockbu Table Definition
--


-- Feeling
create table if not exists feeling(
    id          numeric     primary key,
    name         text,
    create_at   numeric,
    update_at   numeric
);



-- Pop
create table if not exists pop(
    id          integer     primary key   autoincrement,
    feeling_id  numeric,
    music_id    numeric,
    comment     text,
    user_id     numeric,
    like_count  number,
    like_count_speed number,
    create_at   numeric,
    update_at   numeric
);


-- Music
create table if not exists music(
    id          integer     primary key   autoincrement,
    title       text,
    artwork_url text,
    song_url    text,
    artist_id   integer,
    artist_name text,
    genre_id    integer,
    itunes_url  text,
    youtube_id  text,
    feeling_id  integer,
    play_count  numeric,
    play_count_speed numeric,
    pop_count   numeric,
    create_at   numeric,
    update_at   numeric
);


-- Music Link
create table if not exists music_link(
    id          integer   primary key     autoincrement,
    music_id    integer,
    user_id     integer,
    comment     text,
    link        text,
    youtube_id  text,
    nico_id     text,
    use_count   integer default 0,  -- no need??
    play_count  numeric,
    play_count_speed numeric,
    create_at   numeric,
    update_at   numeric
);


-- Artist
create table if not exists artist (
    id          integer     primary key     autoincrement,
    name        text,
    create_at   numeric,
    update_at   numeric
);




-- User
create table if not exists user(
  id          integer     primary key     autoincrement,
  user_id     text,
  password    text,
  name        text,
  sex         integer,
  birthday    integer,
  thumb_url   text,
  pocket_filter text,       -- JavaScript Array of User pocket filter.
  like_pop    text,         -- JavaScript Array of User like pop ids.
  uid         text,
  google_identifier text,
  facebook_id text,
  facebook_access_token text,
  twitter_token text,
  twitter_token_secret text,
  create_at   numeric,
  update_at   numeric
);


-- User Pocket
create table if not exists user_pocket(
    id          integer     primary key     autoincrement,
    user_id     integer,
    music_id    integer,
    feeling_id  integer,
    tags        text,
    music_link_id integer,
    youtube_id  text,
    create_at   numeric,
    update_at   numeric
);


-- User Playlist
create table if not exists user_playlist(
    id          integer     primary key     autoincrement,
    user_id     integer,
    type        integer,
    title       text,
    seq         integer,
    user_pocket_ids text,       -- javascript array.
    dest_playlist_id integer,   -- playlist follow.
    create_at   numeric,
    update_at   numeric
);



-- User Follow
create table if not exists user_follow(
    id          integer     primary key     autoincrement,
    user_id     integer,
    dest_user_id integer,
    create_at   numeric,
    update_at   numeric
);


-- User Artist Follow
create table if not exists user_artist_follow(
    id          integer     primary key     autoincrement,
    user_id     integer,
    artist_id   integer,
    create_at   numeric,
    update_at   numeric
);


-- User Notification
create table if not exists user_notification (
    id          integer     primary key     autoincrement,
    user_id     integer,
    type        integer,
    json        text,
    read        integer,
    create_at   numeric,
    update_at   numeric
);




-- iTunes Ranking
create table if not exists itunes_ranking(
    id          integer     primary key   autoincrement,
    ranking     integer,
    genre_id    integer,
    genre_name  text,
    music_id    integer,
    title       text,
    artwork_url text,
    song_url    text,
    artist_name text,
    itunes_url  text,
    create_at   numeric,
    update_at   numeric
);


-- Code
create table if not exists code(
    id          integer     primary key     autoincrement,
    key1        text,
    key2        text,
    value       text,
    create_at   numeric,
    update_at   numeric
);



-- Report
create table if not exists report (
    id          integer     primary key     autoincrement,
    type        integer,
    user_id     integer,
    comment     text,
    create_at   numeric,
    update_at   numeric
);














