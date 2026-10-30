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
