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
import * as migration_20260514_100100_invoice_status_default_draft from "./20260514_100100_invoice_status_default_draft";
import * as migration_20260515_120000_role_resident_cofounder from "./20260515_120000_role_resident_cofounder";
import * as migration_20260518_180000_profile_rsvp_group from "./20260518_180000_profile_rsvp_group";
import * as migration_20260519_120000_profile_rsvp_tier from "./20260519_120000_profile_rsvp_tier";
import * as migration_20260519_180000_ticket_orders from "./20260519_180000_ticket_orders";
import * as migration_20260520_140000_ticket_orders_mailed_at_locale from "./20260520_140000_ticket_orders_mailed_at_locale";
import * as migration_20260520_183404 from "./20260520_183404";
import * as migration_20260522_190000_day_n_night_event_open from "./20260522_190000_day_n_night_event_open";
import * as migration_20260523_120000_day_n_night_event_upsert from "./20260523_120000_day_n_night_event_upsert";
import * as migration_20260523_203000_passkey_credential_ids_varchar from "./20260523_203000_passkey_credential_ids_varchar";
import * as migration_20260523_204500_ticket_order_sender_name from "./20260523_204500_ticket_order_sender_name";
import * as migration_99999999_000000_initial_seed from "./99999999_000000_initial_seed";

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
  },
  {
    up: migration_20260514_100100_invoice_status_default_draft.up,
    down: migration_20260514_100100_invoice_status_default_draft.down,
    name: "20260514_100100_invoice_status_default_draft"
  },
  {
    up: migration_20260515_120000_role_resident_cofounder.up,
    down: migration_20260515_120000_role_resident_cofounder.down,
    name: "20260515_120000_role_resident_cofounder"
  },
  {
    up: migration_20260518_180000_profile_rsvp_group.up,
    down: migration_20260518_180000_profile_rsvp_group.down,
    name: "20260518_180000_profile_rsvp_group"
  },
  {
    up: migration_20260519_120000_profile_rsvp_tier.up,
    down: migration_20260519_120000_profile_rsvp_tier.down,
    name: "20260519_120000_profile_rsvp_tier"
  },
  {
    up: migration_20260519_180000_ticket_orders.up,
    down: migration_20260519_180000_ticket_orders.down,
    name: "20260519_180000_ticket_orders"
  },
  {
    up: migration_20260520_140000_ticket_orders_mailed_at_locale.up,
    down: migration_20260520_140000_ticket_orders_mailed_at_locale.down,
    name: "20260520_140000_ticket_orders_mailed_at_locale"
  },
  {
    up: migration_20260520_183404.up,
    down: migration_20260520_183404.down,
    name: "20260520_183404"
  },
  {
    up: migration_20260522_190000_day_n_night_event_open.up,
    down: migration_20260522_190000_day_n_night_event_open.down,
    name: "20260522_190000_day_n_night_event_open"
  },
  {
    up: migration_20260523_120000_day_n_night_event_upsert.up,
    down: migration_20260523_120000_day_n_night_event_upsert.down,
    name: "20260523_120000_day_n_night_event_upsert"
  },
  {
    up: migration_20260523_203000_passkey_credential_ids_varchar.up,
    down: migration_20260523_203000_passkey_credential_ids_varchar.down,
    name: "20260523_203000_passkey_credential_ids_varchar"
  },
  {
    up: migration_20260523_204500_ticket_order_sender_name.up,
    down: migration_20260523_204500_ticket_order_sender_name.down,
    name: "20260523_204500_ticket_order_sender_name"
  },
  {
    up: migration_99999999_000000_initial_seed.up,
    down: migration_99999999_000000_initial_seed.down,
    name: "99999999_000000_initial_seed"
  }
];
