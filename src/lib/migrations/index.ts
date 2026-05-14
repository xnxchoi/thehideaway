import * as migration_20260309_050036 from "./20260309_050036";
import * as migration_20260316_044453 from "./20260316_044453";
import * as migration_20260316_135700 from "./20260316_135700";
import * as migration_20260319_155516 from "./20260319_155516";
import * as migration_20260324_192442 from "./20260324_192442";
import * as migration_20260330_084157 from "./20260330_084157";
import * as migration_20260330_120000 from "./20260330_120000";
import * as migration_20260403_044023 from "./20260403_044023";
import * as migration_20260403_search_score from "./20260403_search_score";
import * as migration_20260404_072209 from "./20260404_072209";
import * as migration_20260421_084752 from "./20260421_084752";
import * as migration_20260426_115336 from "./20260426_115336";
import * as migration_20260426_150154 from "./20260426_150154";
import * as migration_20260428_033321 from "./20260428_033321";
import * as migration_20260428_035747 from "./20260428_035747";
import * as migration_20260430_071651 from "./20260430_071651";
import * as migration_20260503_020008 from "./20260503_020008";
import * as migration_20260507_165256 from "./20260507_165256";
import * as migration_20260511_085557_posts_author_status_updated_idx from "./20260511_085557_posts_author_status_updated_idx";
import * as migration_20260512_120000_ticketing_money_resilience from "./20260512_120000_ticketing_money_resilience";
import * as migration_20260514_100000_commerce_shape_v2 from "./20260514_100000_commerce_shape_v2";

export const migrations = [
  {
    up: migration_20260309_050036.up,
    down: migration_20260309_050036.down,
    name: "20260309_050036"
  },
  {
    up: migration_20260316_044453.up,
    down: migration_20260316_044453.down,
    name: "20260316_044453"
  },
  {
    up: migration_20260316_135700.up,
    down: migration_20260316_135700.down,
    name: "20260316_135700"
  },
  {
    up: migration_20260319_155516.up,
    down: migration_20260319_155516.down,
    name: "20260319_155516"
  },
  {
    up: migration_20260324_192442.up,
    down: migration_20260324_192442.down,
    name: "20260324_192442"
  },
  {
    up: migration_20260330_084157.up,
    down: migration_20260330_084157.down,
    name: "20260330_084157"
  },
  {
    up: migration_20260330_120000.up,
    down: migration_20260330_120000.down,
    name: "20260330_120000"
  },
  {
    up: migration_20260403_044023.up,
    down: migration_20260403_044023.down,
    name: "20260403_044023"
  },
  {
    up: migration_20260403_search_score.up,
    down: migration_20260403_search_score.down,
    name: "20260403_search_score"
  },
  {
    up: migration_20260404_072209.up,
    down: migration_20260404_072209.down,
    name: "20260404_072209"
  },
  {
    up: migration_20260421_084752.up,
    down: migration_20260421_084752.down,
    name: "20260421_084752"
  },
  {
    up: migration_20260426_115336.up,
    down: migration_20260426_115336.down,
    name: "20260426_115336"
  },
  {
    up: migration_20260426_150154.up,
    down: migration_20260426_150154.down,
    name: "20260426_150154"
  },
  {
    up: migration_20260428_033321.up,
    down: migration_20260428_033321.down,
    name: "20260428_033321"
  },
  {
    up: migration_20260428_035747.up,
    down: migration_20260428_035747.down,
    name: "20260428_035747"
  },
  {
    up: migration_20260430_071651.up,
    down: migration_20260430_071651.down,
    name: "20260430_071651"
  },
  {
    up: migration_20260503_020008.up,
    down: migration_20260503_020008.down,
    name: "20260503_020008"
  },
  {
    up: migration_20260507_165256.up,
    down: migration_20260507_165256.down,
    name: "20260507_165256"
  },
  {
    up: migration_20260511_085557_posts_author_status_updated_idx.up,
    down: migration_20260511_085557_posts_author_status_updated_idx.down,
    name: "20260511_085557_posts_author_status_updated_idx"
  },
  {
    up: migration_20260512_120000_ticketing_money_resilience.up,
    down: migration_20260512_120000_ticketing_money_resilience.down,
    name: "20260512_120000_ticketing_money_resilience"
  },
  {
    up: migration_20260514_100000_commerce_shape_v2.up,
    down: migration_20260514_100000_commerce_shape_v2.down,
    name: "20260514_100000_commerce_shape_v2"
  }
];
