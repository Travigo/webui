export default {
  time(datetimeString) {
    const timeRegex = /[0-9]{4}-[0-9]{2}-[0-9]{2}T([0-9]{2}):([0-9]{2}):[0-9]{2}Z/;
    let matches = datetimeString.match(timeRegex);

    return `${matches[1]}:${matches[2]}`
  },
  day(datetimeString) {
    let datetime = new Date(Date.parse(datetimeString))
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    return days[datetime.getDay()]
  },
}