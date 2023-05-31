import { redirect } from '@sveltejs/kit';

import { browser } from '$app/environment';

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const parentData = await parent();
  if (browser && !parentData.simulation) throw redirect(302, '/settings');
  return parentData;
};
