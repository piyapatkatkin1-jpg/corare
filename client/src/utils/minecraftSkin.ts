/**
 * Helper to get Minecraft skin avatar head or 3D full-body renders
 */
export function getMinecraftHeadUrl(uuidOrUsername?: string | null, size = 64): string {
  if (!uuidOrUsername) {
    return `https://crafatar.com/avatars/MHF_Steve?size=${size}&overlay`;
  }
  return `https://crafatar.com/avatars/${uuidOrUsername}?size=${size}&default=MHF_Steve&overlay`;
}

export function getMinecraftBodyUrl(uuidOrUsername?: string | null, scale = 4): string {
  if (!uuidOrUsername) {
    return `https://crafatar.com/renders/body/MHF_Steve?scale=${scale}&overlay`;
  }
  return `https://crafatar.com/renders/body/${uuidOrUsername}?scale=${scale}&default=MHF_Steve&overlay`;
}
