
-- FEELINGテーブル
CREATE TABLE feeling (
    id          BIGINT     primary key,
    name         text,
    create_at   BIGINT,
    update_at   BIGINT
);

-- POPテーブル
CREATE TABLE pop (
    id          BIGINT     primary key   AUTO_INCREMENT,
    feeling_id  INT,
    music_id    BIGINT,
    comment     text,
    user_id     BIGINT,
    create_at   BIGINT,
    update_at   BIGINT,
    like_count  INT,
    like_count_speed INT
);

-- Musicテーブル
CREATE TABLE music(
    id          BIGINT     primary key   AUTO_INCREMENT,
    title       text,
    artwork_url text,
    song_url    text,
    artist_name text,
    itunes_url  text,
    create_at   BIGINT,
    update_at   BIGINT,
    youtube_id TEXT,
    artist_id BIGINT,
    genre_id INT,
    play_count INT,
    play_count_speed INT,
    feeling_id INT,
    pop_count INT
);

-- Userテーブル
CREATE TABLE user(
  id                    BIGINT     primary key     AUTO_INCREMENT,
  name                  text,
  thumb_url             text,
  create_at             BIGINT,
  update_at             BIGINT,
  user_id               text,
  password              text,
  sex                   INT,
  birthday              INT,
  pocket_filter         text,
  like_pop              text,
  google_identifier     text,
  facebook_access_token text,
  twitter_token         text,
  twitter_token_secret  text,
  uid                   text,
  facebook_id           text
);


-- CODEテーブル
CREATE TABLE code(
    id          BIGINT     primary key     AUTO_INCREMENT,
    key1        text,
    key2        text,
    value       text,
    create_at   BIGINT,
    update_at   BIGINT
);


-- iTunes Rankinsテーブル
CREATE TABLE itunes_ranking(
    id          BIGINT     primary key   AUTO_INCREMENT,
    ranking     INT,
    genre_id    INT,
    genre_name  text,
    music_id    BIGINT,
    title       text,
    artwork_url text,
    song_url    text,
    artist_name text,
    itunes_url  text,
    create_at   BIGINT,
    update_at   BIGINT,
    artist_id   BIGINT
);

-- Music Linkテーブル
CREATE TABLE music_link(
    id          BIGINT   primary key     AUTO_INCREMENT,
    music_id    BIGINT,
    user_id     BIGINT,
    comment     text,
    link        text,
    youtube_id  text,
    nico_id     text,
    create_at   BIGINT,
    update_at   BIGINT,
    play_count INT,
    play_count_speed INT
);


-- User Pocket
CREATE TABLE user_pocket(
    id              BIGINT     primary key     AUTO_INCREMENT,
    user_id         BIGINT,
    music_id        BIGINT,
    create_at       BIGINT,
    update_at       BIGINT,
    feeling_id      INT,
    tags            text,
    youtube_id      text,
    music_link_id   BIGINT
);


-- User Follow
CREATE TABLE user_follow(
    id              BIGINT     primary key     AUTO_INCREMENT,
    user_id         BIGINT,
    dest_user_id    BIGINT,
    create_at       BIGINT,
    update_at       BIGINT
);


-- User Notification
CREATE TABLE user_notification (
    id          BIGINT     primary key     AUTO_INCREMENT,
    user_id     BIGINT,
    type        INT,
    json        text,
    create_at   BIGINT,
    update_at   BIGINT,
    is_read        INT
);


-- Artist
CREATE TABLE artist (
    id          BIGINT     primary key     AUTO_INCREMENT,
    name        text,
    create_at   BIGINT,
    update_at   BIGINT
);


-- User Artist Follow
CREATE TABLE user_artist_follow(
    id          BIGINT     primary key     AUTO_INCREMENT,
    user_id     BIGINT,
    artist_id   BIGINT,
    create_at   BIGINT,
    update_at   BIGINT
);


CREATE TABLE user_playlist(
    id          BIGINT     primary key     AUTO_INCREMENT,
    user_id     BIGINT,
    type        INT,
    title       text,
    seq         INT,
    user_pocket_ids text,
    create_at   BIGINT,
    update_at   BIGINT
, dest_playlist_id BIGINT);



CREATE TABLE report (
    id          BIGINT     primary key     AUTO_INCREMENT,
    type        INT,
    user_id     BIGINT,
    json        text,
    create_at   BIGINT,
    update_at   BIGINT
);
