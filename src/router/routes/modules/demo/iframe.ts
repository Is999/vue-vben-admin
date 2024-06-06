import type { AppRouteModule } from '@/router/types';

import { LAYOUT } from '@/router/constant';
import { t } from '@/hooks/web/useI18n';

const IFrame = () => import('@/views/sys/iframe/FrameBlank.vue');

const iframe: AppRouteModule = {
  path: '/frame',
  name: 'Frame',
  component: LAYOUT,
  redirect: '/frame/doc',
  meta: {
    orderNo: 1000,
    icon: 'ion:tv-outline',
    title: t('routes.demo.iframe.frame'),
  },

  children: [
    {
      path: 'doc',
      name: 'Doc',
      component: IFrame,
      meta: {
        frameSrc: 'https://doc.vvbin.cn/',
        title: t('routes.demo.iframe.doc'),
      },
    },
    {
      path: 'https://doc.vvbin.cn/',
      name: 'DocExternal',
      component: IFrame,
      meta: {
        title: t('routes.demo.iframe.docExternal'),
      },
    },
    {
      path: 'https://www.antdv.com/docs/vue/introduce-cn/',
      name: 'AntDV',
      component: IFrame,
      meta: {
        // frameSrc: 'https://www.antdv.com/docs/vue/introduce-cn/',
        // title: t('routes.demo.iframe.antv'),
        title: 'AntDV(外链)',
      },
    },
    {
      path: 'https://vxetable.cn/#/table/start/install',
      name: 'VxeTable',
      component: IFrame,
      meta: {
        title: 'VxeTable(外链)',
      },
    },
  ],
};

export default iframe;
