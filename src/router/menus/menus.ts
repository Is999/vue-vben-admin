import { AppRouteModule } from '@/router/types';
import account from '@/router/routes/modules/admin/account';
import system from '@/router/routes/modules/admin/system';
import dashboard from '@/router/routes/modules/dashboard';
import iframe from '@/router/routes/modules/demo/iframe';
import about from '@/router/routes/modules/about';

export const menuList: AppRouteModule[] = [account, dashboard, system, iframe, about];