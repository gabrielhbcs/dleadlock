-- One UTC day of ranked matches, all heroes at once: for every player-match,
-- find the first item bought in each tier and count how often each item was
-- that first purchase. Results for past days never change, so they are cached.
WITH tiers(item_id, tier) AS (VALUES {tiers_values}),
p AS (
    SELECT match_id, account_id, hero_id,
           unnest("items.item_id") AS item_id,
           unnest("items.game_time_s") AS t
    FROM match_player
    WHERE start_time >= '{day_start}' AND start_time < '{day_end}'
      AND game_mode = 'Normal' AND match_mode = 'Ranked'
      AND player_rank_initial_display_rank >= {min_rank}
),
f AS (
    SELECT p.match_id, p.account_id, p.hero_id, tiers.tier, arg_min(p.item_id, p.t) AS first_item
    FROM p JOIN tiers USING (item_id)
    WHERE p.t > 0
    GROUP BY ALL
)
SELECT hero_id, tier, first_item AS item_id, count(*) AS n
FROM f
GROUP BY hero_id, tier, first_item
