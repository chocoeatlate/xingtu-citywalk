const PI = Math.PI
const A = 6378245.0
const EE = 0.006693421622965943

function latitudeOffset(x, y) {
  let result = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  result += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3
  result += (20 * Math.sin(y * PI) + 40 * Math.sin(y / 3 * PI)) * 2 / 3
  result += (160 * Math.sin(y / 12 * PI) + 320 * Math.sin(y * PI / 30)) * 2 / 3
  return result
}

function longitudeOffset(x, y) {
  let result = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  result += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3
  result += (20 * Math.sin(x * PI) + 40 * Math.sin(x / 3 * PI)) * 2 / 3
  result += (150 * Math.sin(x / 12 * PI) + 300 * Math.sin(x / 30 * PI)) * 2 / 3
  return result
}

export function wgs84ToGcj02([latitude, longitude]) {
  if (longitude < 72.004 || longitude > 137.8347 || latitude < 0.8293 || latitude > 55.8271) return [latitude, longitude]
  let dLat = latitudeOffset(longitude - 105, latitude - 35)
  let dLon = longitudeOffset(longitude - 105, latitude - 35)
  const radLat = latitude / 180 * PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = dLat * 180 / ((A * (1 - EE)) / (magic * sqrtMagic) * PI)
  dLon = dLon * 180 / (A / sqrtMagic * Math.cos(radLat) * PI)
  return [latitude + dLat, longitude + dLon]
}
