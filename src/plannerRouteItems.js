function routeItems(plan) {
  return [plan?.RouteItems, plan?.routeItems, plan?.Steps, plan?.steps, plan?.Legs, plan?.legs]
    .find(Array.isArray) || []
}

function isJourneyItem(item) {
  return Boolean(item?.Journey || item?.journey || item?.RealtimeJourney || item?.realtimeJourney)
}

function isTrivialFinalWalk(items) {
  if (items.length < 2) return false

  const final = items.at(-1)
  const previous = items.at(-2)
  if (!isJourneyItem(previous)) return false
  if (String(final?.Type || final?.type).toLowerCase() !== 'transfer') return false
  if (String(final?.TransferType || final?.transferType).toLowerCase() !== 'nearbywalk') return false

  const distance = Number(final.DistanceMetres || final.distanceMetres)
  const duration = Number(final.WalkDurationSeconds || final.walkDurationSeconds || final.TotalDurationSeconds || final.totalDurationSeconds)
  return distance > 0 && distance <= 25 && (!duration || duration <= 120)
}

export function journeyPlanRouteItems(plan) {
  return routeItems(plan)
}

export function journeyPlanForDisplay(plan) {
  const items = routeItems(plan)
  if (!isTrivialFinalWalk(items)) return plan

  const visibleItems = items.slice(0, -1)
  const lastItem = visibleItems.at(-1)
  const arrivalTime = lastItem?.ArrivalTime || lastItem?.arrivalTime || lastItem?.EndTime || lastItem?.endTime
  const startTime = plan?.StartTime || plan?.startTime
  const durationMillis = Date.parse(arrivalTime) - Date.parse(startTime)

  return {
    ...plan,
    RouteItems: visibleItems,
    ...(arrivalTime ? { ArrivalTime: arrivalTime } : {}),
    ...(Number.isFinite(durationMillis) && durationMillis >= 0 ? { Duration: durationMillis * 1e6 } : {})
  }
}
