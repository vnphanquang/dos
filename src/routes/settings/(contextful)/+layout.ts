import { redirect } from '@sveltejs/kit';

import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent }) => {
  const parentData = await parent();
  if (!parentData.simulation) throw redirect(302, '/settings');
  return parentData;
};
