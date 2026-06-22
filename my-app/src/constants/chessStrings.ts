// Ported from compose-multiplatform-chess/.../composeResources/values/strings.xml.
// Keys are preserved so translations drop in (plan §7.4). Format strings become
// functions matching the original %1$s substitution behaviour.

export const STRINGS = {
  app_name: 'Chess',
  reset_button: 'Reset',
  play_again_button: 'Play Again!',
  cancel_button: 'Cancel',
  // game_end_message_winner: "Game ended! %1$s wins!"
  game_end_message_winner: (who: string) => `Game ended! ${who} wins!`,
  // game_end_message_no_winner: "Game ended in a %1$s!"
  game_end_message_no_winner: (result: string) => `Game ended in a ${result}!`,
  promotion_prompt: 'Promote pawn to:',
  offer_draw_button: 'Offer Draw',
  draw_offer_prompt: 'Black offers a draw',
  accept_button: 'Accept',
  decline_button: 'Decline',
  draw_offer_declined: 'Black declined the draw offer',
  board_3d_toggle_label: '3D',
  board_3d_unavailable: '3D renderer failed to initialize',
  loading_3d_engine: 'Loading 3D Engine',
  tearing_down_3d: 'Tearing down 3D board',
} as const;

export type ChessStringKey = keyof typeof STRINGS;
