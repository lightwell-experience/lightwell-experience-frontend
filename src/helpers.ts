import dayjs from 'dayjs';

// Removes null values and builds url params from a given object.
export const objectToUrlParams = (obj: {
  [key: string]: string | string[] | boolean | undefined;
}): string => {
  const keyList = Object.keys(obj).filter((key) => !!obj[key]);

  if (!keyList.length) return '';

  let items = '';
  keyList.forEach((key, index) => {
    const value = obj[key];
    const toAdd = Array.isArray(value)
      ? value.map((item) => `${key}=${item}`).join('&')
      : `${key}=${value}`;

    items += `${toAdd}${index !== keyList.length - 1 ? '&' : ''}`;
  });
  return items;
};

export const formatDateDDMMMYYYY = (date: string, withTime?: boolean): string => {
  const d = dayjs(date);
  if (d.isBefore(dayjs('0001-01-02'))) {
    return `01 Jan 0001${withTime ? ' - 00:00:00' : ''}`;
  }

  return d.format(`DD MMM YYYY${withTime ? ' - HH:mm:ss' : ''}`);
};
