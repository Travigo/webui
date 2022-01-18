export default {
  time(datetimeString) {
    let datetime = new Date(Date.parse(datetimeString))

    let hour = datetime.getHours()
    let minute = datetime.getMinutes()
    let minuteFormatted = minute < 10 ? "0" + minute : minute

    return `${hour}:${minuteFormatted}`
  },
  day(datetimeString) {
    let datetime = new Date(Date.parse(datetimeString))
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    return days[datetime.getDay()]
  },
}