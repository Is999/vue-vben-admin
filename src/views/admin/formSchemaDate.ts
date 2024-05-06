import dayjs, { Dayjs } from 'dayjs';
import { FormSchema } from '@/components/Form';

export type RangeValue = [Dayjs, Dayjs];
// 今日
export const todayRange = [dayjs().startOf('day'), dayjs().endOf('day')];
// 昨日
export const yesterdayRange = [
  dayjs().startOf('day').add(-1, 'day'),
  dayjs().endOf('day').add(-1, 'day'),
];
// 本周
export const weekRange = [dayjs().startOf('week').add(1, 'day'), dayjs().endOf('day')];
// 上周
export const lastWeekRange = [
  dayjs().startOf('week').add(-6, 'day'),
  dayjs().startOf('week').endOf('day'),
];
// 本月
export const monthRange = [dayjs().startOf('month'), dayjs().endOf('day')];
// 上月
export const lastMonthRange = [
  dayjs().startOf('month').add(-1, 'day').startOf('month'),
  dayjs().startOf('month').add(-1, 'day').endOf('month'),
];
// 7日
export const day7Range = [dayjs().startOf('day').add(-7, 'day'), dayjs().endOf('day')];
// 15日
export const day15Range = [dayjs().startOf('day').add(-15, 'day'), dayjs().endOf('day')];
// 30日
export const day30Range = [dayjs().startOf('day').add(-30, 'day'), dayjs().endOf('day')];

// ranges
export const ranges = {
  今日: todayRange as RangeValue,
  昨日: yesterdayRange as RangeValue,
  本周: weekRange as RangeValue,
  上周: lastWeekRange as RangeValue,
  本月: monthRange as RangeValue,
  上月: lastMonthRange as RangeValue,
  '7日': day7Range as RangeValue,
  '15日': day15Range as RangeValue,
  '30日': day30Range as RangeValue,
};

export interface SchemaDataTimeParams {
  field1: string;
  field2: string;
  placeholder1: string;
  placeholder2: string;
  format: string;
  label: string;
  labelWidth: number;
  showTimeFormat: string;
  separator: string;
  defaultValue: any;
  helpMessage: string | string[];
  ranges: Recordable;
}

export function formSchemaRangeDataTime(params?: SchemaDataTimeParams): FormSchema {
  return {
    field: `[${params?.field1 ?? 'startTime'}, ${params?.field2 ?? 'endTime'}]`,
    label: params?.label ?? '时间',
    labelWidth: params?.labelWidth ?? 100,
    component: 'RangePicker',
    defaultValue: params?.defaultValue ?? todayRange,
    helpMessage: params?.helpMessage ?? '',
    componentProps: {
      format: params?.format ?? 'YYYY-MM-DD HH:mm:ss',
      placeholder: [params?.placeholder1 ?? '开始时间', params?.placeholder2 ?? '结束时间'],
      showTime: params?.showTimeFormat ? { format: params?.showTimeFormat ?? 'HH:mm:ss' } : false,
      separator: params?.separator ?? '~',
      // showNow: true,
      // showToday: true,
      ranges: params?.ranges ?? ranges,
    },
  };
}
