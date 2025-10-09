// Генератор уникальных значений, вынесенный в отдельный файл.
export function uniq(info, label = 'unique') {
  return `${label}_${Date.now()}_${info.workerIndex}`
}

export function uniqEmail(info, label = 'user') {
  return `${uniq(info, label)}@example.com`
}
