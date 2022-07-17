import { Profile, Slug } from './types';
import { getRootContainer } from './spaces';

export function appSettingsUrl(profile: Profile, namespace: Slug, name: Slug) {
  const base = getRootContainer(profile);
  const path = `settings/${namespace}.ttl#${name}`;
  return base && new URL(path, base).toString();
}
